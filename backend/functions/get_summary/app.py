import os
import boto3
import json
from aws_lambda_powertools import Logger
from PyPDF2 import PdfReader

logger = Logger()

MODEL_ID = "anthropic.claude-instant-v1"


bedrock = boto3.client(
    service_name="bedrock-runtime",
    region_name="us-east-1",
)


# s3_client = boto3.client("s3")
s3 = boto3.resource("s3")


S3_BUCKET = os.environ["DESTINATION_BUCKETNAME"]


def fetch_pdf(path: str) -> str:
    file_extension = os.path.splitext(path)[1]
    if file_extension.lower() != ".pdf":
        raise ValueError("File is not a PDF")

    reader = PdfReader(path)
    return "\n".join(page.extract_text() for page in reader.pages)


def download_s3_object(bucket_name, object_key):
    # Initialize the S3 resource
    s3 = boto3.resource("s3")

    local_path = f"/tmp/{object_key}"

    try:
        # Download the object from S3
        s3.Bucket(bucket_name).download_file(object_key, local_path)
        return local_path
    except Exception as e:
        logger.error(f"Error downloading object: {str(e)}")


def construct_prompt(text, max_tokens, temp, top_k):
    # Read more about parameters here: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters.html#model-parameters-claude

    # Construct prompt
    prompt = f""" This is an example of a summary of an animal's medical journal:
Owner: Jane Doe
Address: Gatvägen 7a, 111 99 STOCKHOLM, Sweden
Phone: +46 70 123 45 67
Email: mail@mail.com

Patient: Fido (microchip #567898765678)
Species: Domestic shorthair cat
Sex: Spayed female
Date of birth: 2011-05-11
Weight: 4.8 kg

Visit 1: January 7, 2021
Clinic: Lunds Djursjukhus Evidensia
Reason for visit: lethargy, slight fever
Diagnosis: Fever
Notes: Young dog presenting with dampened behavior and fever. Treated and recovered. 

Visit 2: July 24, 2021
Clinic: Evidensia Djursjukhuset Malmö
Reason for visit: shaking, abnormal breathing
Diagnosis: Symptoms of undiagnosed illness, non-specific
Notes: Developed shaking and breathing issues after swimming in a lake. Condition improved at hospital.

Visit 3: September 24, 2023
Clinic: Sundsvall Djursjukhus Evidensia
Reason for visit: vomiting, unsteady gait about 1.5 hours after eating feces in forest
Diagnosis: Symptoms of poisoning  
Notes: Admitted for IV treatment and monitoring for suspected cannabis poisoning. Tests confirmed cannabis. Condition improved and discharged September 25.


Below is a medical journal for an animal. Create a complete and thorough summary, using the above example. Include information about the animal, it's owner and list all veterinary visits including date, reason for visit, notes and diagnosis:

{text}
        """

    prompt = "Human: " + prompt + "\n Assistant:"
    prompt_config = {
        "prompt": prompt,
        "max_tokens_to_sample": max_tokens,
        "temperature": temp,
        "top_k": top_k,
    }

    return json.dumps(prompt_config)


def lambda_handler(event, context):
    logger.info(event)

    # Get s3 info from event payload
    s3_bucket = event["Records"][0]["s3"]["bucket"]["name"]
    object_key = event["Records"][0]["s3"]["object"]["key"]

    # Fetch object
    local_path = download_s3_object(s3_bucket, object_key)

    # Parse PDF
    text = fetch_pdf(local_path)

    # Construct prompt
    body = construct_prompt(text, max_tokens=8100, temp=0.3, top_k=50)

    # Invoke bedrock with prompt
    response = bedrock.invoke_model(
        body=body,
        modelId=MODEL_ID,
        accept="application/json",
        contentType="application/json",
    )

    response_body = json.loads(response.get("body").read())
    summary = response_body["completion"].strip()

    logger.info(summary)

    object_id = object_key.split(".")[0]

    # Store summary in S3
    object = s3.Object(bucket_name=S3_BUCKET, key=f"summaries/{object_id}.txt")
    object.put(Body=summary)

    return
