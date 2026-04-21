import openai

client = openai.OpenAI(
    api_key = "sk-poe-aFiMgvGYXIX4Adf-8w65GPj4AD7CKrLNT68ZYvG1s3c",  # or os.getenv("POE_API_KEY")
    base_url = "https://api.poe.com/v1",
)

response = client.responses.create(
    model = "gpt-5.3-codex-spark",
    input = "Write a Python function where given an int array, it returns the length of the longest strictly increasing subsequence. Give the naive solution and an optimal solution."
)

print(response.output_text)