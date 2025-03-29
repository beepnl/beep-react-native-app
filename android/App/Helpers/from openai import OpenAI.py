from openai import OpenAI
from os import getenv

# gets API Key from environment variable OPENAI_API_KEY
client = OpenAI(
base_url="https://openrouter.ai/api/v1",
api_key=getenv("OPENROUTER_API_KEY"),
)

completion = client.chat.completions.create(
model="openai/o1-preview",
messages=[
   {
      "role": "user",
      "content": "In javascript, I have a 24-bit signed value that consists of three bytes. How can I calculate the two's complement of this value and store it in a 32-bit integer type?"
   }
]
)
print(completion.choices[0].message.content)