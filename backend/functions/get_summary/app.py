import os
import boto3
from aws_lambda_powertools import Logger

logger = Logger()


s3_client = boto3.client("s3")

S3_BUCKET = os.environ["DESTINATION_BUCKETNAME"]


def lambda_handler(event, context):
    logger.info("## Invocation started")

    logger.info(event)
