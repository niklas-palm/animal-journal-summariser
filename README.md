## Med journal summary

Sets up the infrastructure to quickly summarise animal medical journals, for demo purposes. Uses AWS Bedrock amnd Claude with one-shot prompting.

### Prerequisites

- [OIDC set up between Github and your AWS account](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- Manually set the OIDC_ROLE environment variable in `.github/workflows/backend.yml` and `.github/workflows/backend.yml` to the role created using the tutorial above.
- [Install AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Access to Claude Instant in your AWS account.
