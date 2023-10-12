import os
import json
import boto3
import random
import string
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

logger = Logger()


s3_client = boto3.client("s3")

S3_BUCKET = os.environ["INGEST_BUCKET"]


def create_presigned_post(
    bucket_name, object_name, fields=None, conditions=None, expiration=3600
):
    """Generate a presigned URL S3 POST request to upload a file

    :param bucket_name: string
    :param object_name: string
    :param fields: Dictionary of prefilled form fields
    :param conditions: List of conditions to include in the policy
    :param expiration: Time in seconds for the presigned URL to remain valid
    :return: Dictionary with the following keys:
        url: URL to post to
        fields: Dictionary of form fields and values to submit with the POST
    :return: None if error.
    """
    # Generate a presigned S3 POST URL
    try:
        response = s3_client.generate_presigned_post(
            bucket_name,
            object_name,
            Fields=fields,
            Conditions=conditions,
            ExpiresIn=expiration,
        )
    except ClientError as e:
        logger.exception(e)
        raise

    # The response contains the presigned URL and required fields
    return response


def create_object_key(file_type):
    file_name = (
        "".join(random.choice(string.ascii_lowercase) for i in range(5))
        + "."
        + file_type
    )

    return file_name


def lambda_handler(event, context):
    logger.info("## Invocation started")

    try:
        file_type = event["queryStringParameters"]["file"]
        logger.info(event)

        object_name = create_object_key(file_type)

        response = create_presigned_post(S3_BUCKET, object_name)

        logger.debug("## Presigned response:")
        logger.debug(response)

        return {
            "statusCode": 200,
            "body": json.dumps(response),
        }

    except Exception as e:
        logger.exception(e)
        return {
            "statusCode": 500,
            "body": json.dumps(
                {"message": "Internal server error. Could not generate presigned URL"}
            ),
        }
