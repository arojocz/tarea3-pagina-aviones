# Before running the sample:
#    pip install azure-ai-projects>=2.0.0

from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

endpoint = "https://arojocz-3933f-resource.services.ai.azure.com/api/projects/arojocz-3933f"

project_client = AIProjectClient(
    endpoint=endpoint,
    credential=DefaultAzureCredential(),
)

my_agent = "gpt41git"
my_version = "2"

openai_client = project_client.get_openai_client()

# Reference the agent to get a response
response = openai_client.responses.create(
    input=[{"role": "user", "content": "Dime Lindura."}],
    extra_body={"agent_reference": {"name": my_agent, "version": my_version, "type": "agent_reference"}},
)

print(f"Response output: {response.output_text}")



