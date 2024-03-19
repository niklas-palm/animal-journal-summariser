import os
import boto3
import json
from aws_lambda_powertools import Logger
from PyPDF2 import PdfReader

logger = Logger()

MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"

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


def construct_prompt(journal_text):
    response_structure = """
{
    "animal_name": "string",
    "animal_species": "string",
    "animal_breed": "string"
    "animal_sex": "string",
    "animal_owner": "string",
    "animal_date_of_birth": "string",
    "animal_weight": "string"
    "animal_address": "string",
    "animal_phone": "string",
    "animal_email": "string"
    "visits": [
        {
            "date": "string",
            "clinic": "string",
            "reason": "string",
            "diagnosis": "string",
            "treatment": "string",
            "notes": "string"
        }
    ]
}
"""

    rules = """
- You only include information you are certain of.
- If you are not certain, put "unknown" as the value.
"""

    prompt = f"""
<instructions>
You are an animal journal data extraction tool. 
Given a medical animal journal, you extract all of the relevant information related to the animal and all visits to the veterinary, including the reason for visit, diagnosis, treatment and relevant information to the visit.

You respond only in JSON-format, with the following structure:
<response-structure>
{response_structure}
</response-structure>

These are some rules:
<rules>
{rules}
</rules>

</instructions>


<task>
Given the extracted text from the journal below, extract all information into the provided schema.
</task>

<journal>
{journal_text}
</journal>
"""
    prompt_config = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        # "system": "Always respond in English.",
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": prompt}],
            },
            {
                "role": "assistant",
                "content": "{",
            },
        ],
        "temperature": 0.1,
    }

    return json.dumps(prompt_config)


def invoke_model(payload):
    response = bedrock.invoke_model(body=payload, modelId=MODEL_ID)

    return json.loads(response.get("body").read())


def parse_output_as_json(output):
    return json.loads("{" + output)


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
    response = invoke_model(construct_prompt(text))

    try:
        parsed_response = parse_output_as_json(response["content"][0]["text"])
    except:
        logger.error(response)
        raise ValueError("Could not parse output as JSON")

    logger.info(parsed_response)

    object_id = object_key.split(".")[0]

    # Store summary in S3
    object = s3.Object(bucket_name=S3_BUCKET, key=f"summaries/{object_id}.json")
    object.put(Body=json.dumps(parsed_response))

    return
