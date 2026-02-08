should we also ask the prompt to make it api ready, i mean making the ui design ready for teh backedn?? and for the ai part am thinking of using dedalus labs sdk  since they are a sponsor > ## Documentation Index
> Fetch the complete documentation index at: https://docs.dedaluslabs.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to build, run, and deploy agents with the Dedalus SDK in minutes

Dedalus helps you ship agent workflows that are:

* **Provider-agnostic**: Use OpenAI, Anthropic, Google, xAI, DeepSeek, and more with one API.
* **Tool- and MCP-native**: Let models call local functions and hosted MCP servers.
* **Production-ready**: Streaming, structured outputs, routing/handoffs, and runtime policies.

## What are you trying to build?

| Goal                                         | Description                                                      |
| -------------------------------------------- | ---------------------------------------------------------------- |
| [Chat with a model](/sdk/chat)               | Send a prompt and get a response from any provider/model.        |
| [Equip a model with tools](/sdk/tools)       | Let the model call typed Python/TS functions that you implement. |
| [Stream agent output](/sdk/streaming)        | Print responses as they're generated (great for UIs/CLIs).       |
| [Add MCP server](/dmcp/quickstart)           | Connect to hosted MCP servers with one line.                     |
| [Get reliable JSON](/sdk/structured-outputs) | Validate model output against schemas (Pydantic/Zod).            |
| [Route across models](/sdk/handoffs)         | Provide multiple models; the agent can route/handoff by phase.   |

## Installation

<CodeGroup>
  ```bash Python theme={"theme":{"light":"github-light","dark":"github-dark"}}
  uv pip install dedalus_labs
  ```

  ```bash npm theme={"theme":{"light":"github-light","dark":"github-dark"}}
  npm install dedalus-labs
  ```

  ```bash yarn theme={"theme":{"light":"github-light","dark":"github-dark"}}
  yarn add dedalus-labs
  ```

  ```bash pnpm theme={"theme":{"light":"github-light","dark":"github-dark"}}
  pnpm add dedalus-labs
  ```

  ```bash bun theme={"theme":{"light":"github-light","dark":"github-dark"}}
  bun add dedalus-labs
  ```
</CodeGroup>

## Set Your API Key

Get your API key from the [dashboard](https://www.dedaluslabs.ai/dashboard/api-keys) and set it as an environment variable:

```bash  theme={"theme":{"light":"github-light","dark":"github-dark"}}
export DEDALUS_API_KEY="your-api-key"
```

Or use a `.env` file:

```bash  theme={"theme":{"light":"github-light","dark":"github-dark"}}
DEDALUS_API_KEY=your-api-key
```

## Your First Request

Let’s build this incrementally.

### 1) Chat with a model

```python  theme={"theme":{"light":"github-light","dark":"github-dark"}}
import asyncio
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv

load_dotenv()

async def main():
    client = AsyncDedalus()
    runner = DedalusRunner(client)

    response = await runner.run(
        input="What are the key factors that influence weather patterns?",
        model="anthropic/claude-opus-4-6",
    )

    print(response.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

### 2) Add an MCP server

Here we connect a well-known MCP server and let the model use it.

```python  theme={"theme":{"light":"github-light","dark":"github-dark"}}
import asyncio
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv

load_dotenv()

async def main():
    client = AsyncDedalus()
    runner = DedalusRunner(client)

    response = await runner.run(
        input="What's the weather forecast for San Francisco this week?",
        model="anthropic/claude-opus-4-6",
        mcp_servers=["windsornguyen/open-meteo-mcp"],  # Weather forecasts via Open-Meteo
    )

    print(response.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

### 3) Add a local tool

Define a function with type hints and a docstring. Pass it to `runner.run()`. The SDK extracts the schema automatically and handles execution when the model decides to use it.

```python  theme={"theme":{"light":"github-light","dark":"github-dark"}}
import asyncio
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv

load_dotenv()

def as_bullets(items: list[str]) -> str:
    """Format items as a bulleted list."""
    return "\n".join(f"• {item}" for item in items)

async def main():
    client = AsyncDedalus()
    runner = DedalusRunner(client)

    response = await runner.run(
        input=(
            "Get the 7-day weather forecast for San Francisco "
            "and format the daily conditions as bullets using as_bullets."
        ),
        model="anthropic/claude-opus-4-6",
        mcp_servers=["windsornguyen/open-meteo-mcp"],
        tools=[as_bullets],
    )

    print(response.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

### 4) Stream output

```python  theme={"theme":{"light":"github-light","dark":"github-dark"}}
import asyncio
from dedalus_labs import AsyncDedalus, DedalusRunner
from dedalus_labs.utils.stream import stream_async
from dotenv import load_dotenv

load_dotenv()

async def main():
    client = AsyncDedalus()
    runner = DedalusRunner(client)

    stream = runner.run(
        input="Explain how weather forecasting works in one paragraph, streaming as you write.",
        model="anthropic/claude-opus-4-6",
        stream=True,
    )

    await stream_async(stream)

if __name__ == "__main__":
    asyncio.run(main())
```

## Next steps

* **Start from a template**: [Use cases](/sdk/use-cases/web-search-agent) — Common agent patterns
* **See working recipes**: [Cookbook](/sdk/cookbook/session-management) — End-to-end implementations
* **Go deeper**: [Tools](/sdk/tools), [MCP Servers](/sdk/mcp), [Structured outputs](/sdk/structured-outputs), [Streaming](/sdk/streaming)

## Get the latest SDKs

<CardGroup cols={2}>
  <Card title="Python SDK" icon="github" href="https://github.com/dedalus-labs/dedalus-sdk-python">
    dedalus-labs/dedalus-sdk-python
  </Card>

  <Card title="TypeScript SDK" icon="github" href="https://github.com/dedalus-labs/dedalus-sdk-typescript">
    dedalus-labs/dedalus-sdk-typescript
  </Card>
</CardGroup>

<Tip>
  [Connect these docs programmatically](/contextual/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
</Tip> > ## Documentation Index
> Fetch the complete documentation index at: https://docs.dedaluslabs.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Streaming

> Display responses as they're generated

Streaming shows output token-by-token instead of waiting for the complete response. Users see progress immediately, which matters for longer outputs or interactive applications.

## Stream in one line

Set `stream=True` so users see progress as the agent works.

<CodeGroup>
  ```python Python theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import asyncio
  from dedalus_labs import AsyncDedalus, DedalusRunner
  from dedalus_labs.utils.stream import stream_async
  from dotenv import load_dotenv

  load_dotenv()

  async def main():
      client = AsyncDedalus()
      runner = DedalusRunner(client)

      stream = runner.run(
          input="Find me the nearest basketball games in January in San Francisco (stream your work).",
          model="anthropic/claude-opus-4-5",
          mcp_servers=["windsor/ticketmaster-mcp"],  # Discover events via Ticketmaster
          stream=True,
      )

      await stream_async(stream)

  if __name__ == "__main__":
      asyncio.run(main())
  ```

  ```typescript TypeScript theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import Dedalus from 'dedalus-labs';
  import { DedalusRunner } from 'dedalus-labs';

  const client = new Dedalus();
  const runner = new DedalusRunner(client, true);

  async function main() {
    const result = await runner.run({
      input: 'Find me the nearest basketball games in January in San Francisco (stream your work).',
      model: 'anthropic/claude-opus-4-5',
      mcpServers: ['windsor/ticketmaster-mcp'], // Discover events via Ticketmaster
      stream: true,
    });

    if (Symbol.asyncIterator in result) {
      for await (const chunk of result) {
        if (chunk.choices?.[0]?.delta?.content) {
          process.stdout.write(chunk.choices[0].delta.content);
        }
      }
    }
  }

  main();
  ```
</CodeGroup>

## Streaming with Tools

Streaming works with tool-calling workflows. You can stream while the agent calls **local tools**, **MCPs**, or both.

<CodeGroup>
  ```python Python theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import asyncio

  from dedalus_labs import AsyncDedalus, DedalusRunner
  from dedalus_labs.utils.stream import stream_async
  from dotenv import load_dotenv

  load_dotenv()

  def summarize_headlines(headlines: list[str]) -> str:
      """Format headlines as a short bullet list."""
      return "\n".join(f"• {h}" for h in headlines[:3])

  async def main():
      client = AsyncDedalus()
      runner = DedalusRunner(client)

      stream = runner.run(
          input=(
              "Search for AI news. Extract 3 headlines. "
              "Then call summarize_headlines(headlines) and stream your final answer."
          ),
          model="openai/gpt-5.2",
          mcp_servers=["windsor/brave-search-mcp"],  # Web search via Brave Search MCP
          tools=[summarize_headlines],
          stream=True,
      )

      await stream_async(stream)

  if __name__ == "__main__":
      asyncio.run(main())
  ```

  ```typescript TypeScript theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import Dedalus from 'dedalus-labs';
  import { DedalusRunner } from 'dedalus-labs';

  function summarizeHeadlines(headlines: string[]): string {
    return headlines.slice(0, 3).map((h) => `• ${h}`).join('\n');
  }

  const client = new Dedalus();
  const runner = new DedalusRunner(client, true);

  async function main() {
    const result = await runner.run({
      input:
        'Search for AI news. Extract 3 headlines. Then call summarizeHeadlines(headlines) and stream your final answer.',
      model: 'openai/gpt-5.2',
      mcpServers: ['windsor/brave-search-mcp'], // Web search via Brave Search MCP
      tools: [summarizeHeadlines],
      stream: true,
    });

    if (Symbol.asyncIterator in result) {
      for await (const chunk of result) {
        if (chunk.choices?.[0]?.delta?.content) {
          process.stdout.write(chunk.choices[0].delta.content);
        }
      }
    }
  }

  main();
  ```
</CodeGroup>

## Compare: non-streaming vs streaming (same scenario)

The scenario below is the same in both snippets. The only difference is whether you set `stream=True` **and iterate over the stream**.

<Note>
  In Python, **non-streaming** refers to `stream=False`, not “sync”. If you use `AsyncDedalus`, you’ll still write async code and use `asyncio.run(...)`. If you prefer fully synchronous code, use the `Dedalus` client (example below).
</Note>

### Python

<CodeGroup>
  ```python Non-streaming (AsyncDedalus) theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import asyncio
  from dedalus_labs import AsyncDedalus, DedalusRunner
  from dotenv import load_dotenv

  load_dotenv()

  async def main():
      client = AsyncDedalus()
      runner = DedalusRunner(client)

      result = await runner.run(
          input="Find me the nearest basketball games in January in San Francisco.",
          model="anthropic/claude-opus-4-5",
          mcp_servers=["windsor/ticketmaster-mcp"],  # Discover events via Ticketmaster
      )

      # You only see output after the full run completes.
      print(result.final_output)

  if __name__ == "__main__":
      asyncio.run(main())
  ```

  ```python Streaming (AsyncDedalus) theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import asyncio
  from dedalus_labs import AsyncDedalus, DedalusRunner
  from dedalus_labs.utils.stream import stream_async
  from dotenv import load_dotenv

  load_dotenv()

  async def main():
      client = AsyncDedalus()
      runner = DedalusRunner(client)

      stream = runner.run(
          input="Find me the nearest basketball games in January in San Francisco.",
          model="anthropic/claude-opus-4-5",
          mcp_servers=["windsor/ticketmaster-mcp"],  # Discover events via Ticketmaster
          stream=True,
      )

      # You see output as the model generates it.
      await stream_async(stream)

  if __name__ == "__main__":
      asyncio.run(main())
  ```
</CodeGroup>

### Python (sync client)

<CodeGroup>
  ```python Non-streaming (Dedalus) theme={"theme":{"light":"github-light","dark":"github-dark"}}
  from dedalus_labs import Dedalus, DedalusRunner
  from dotenv import load_dotenv

  load_dotenv()

  def main():
      client = Dedalus()
      runner = DedalusRunner(client)

      result = runner.run(
          input="Find me the nearest basketball games in January in San Francisco.",
          model="anthropic/claude-opus-4-5",
          mcp_servers=["windsor/ticketmaster-mcp"],  # Discover events via Ticketmaster
      )

      print(result.final_output)

  if __name__ == "__main__":
      main()
  ```

  ```python Streaming (Dedalus) theme={"theme":{"light":"github-light","dark":"github-dark"}}
  from dedalus_labs import Dedalus, DedalusRunner
  from dedalus_labs.utils.stream import stream_sync
  from dotenv import load_dotenv

  load_dotenv()

  def main():
      client = Dedalus()
      runner = DedalusRunner(client)

      stream = runner.run(
          input="Find me the nearest basketball games in January in San Francisco.",
          model="anthropic/claude-opus-4-5",
          mcp_servers=["windsor/ticketmaster-mcp"],  # Discover events via Ticketmaster
          stream=True,
      )

      stream_sync(stream)

  if __name__ == "__main__":
      main()
  ```
</CodeGroup>

### TypeScript

<CodeGroup>
  ```typescript Non-streaming theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import Dedalus from 'dedalus-labs';
  import { DedalusRunner } from 'dedalus-labs';

  const client = new Dedalus();
  const runner = new DedalusRunner(client, true);

  async function main() {
    const result = await runner.run({
      input: 'Find me the nearest basketball games in January in San Francisco.',
      model: 'anthropic/claude-opus-4-5',
      mcpServers: ['windsor/ticketmaster-mcp'], // Discover events via Ticketmaster
    });

    console.log((result as any).finalOutput);
  }

  main();
  ```

  ```typescript Streaming theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import Dedalus from 'dedalus-labs';
  import { DedalusRunner } from 'dedalus-labs';

  const client = new Dedalus();
  const runner = new DedalusRunner(client, true);

  async function main() {
    const result = await runner.run({
      input: 'Find me the nearest basketball games in January in San Francisco.',
      model: 'anthropic/claude-opus-4-5',
      mcpServers: ['windsor/ticketmaster-mcp'], // Discover events via Ticketmaster
      stream: true,
    });

    if (Symbol.asyncIterator in result) {
      for await (const chunk of result) {
        if (chunk.choices?.[0]?.delta?.content) {
          process.stdout.write(chunk.choices[0].delta.content);
        }
      }
    }
  }

  main();
  ```
</CodeGroup>

## How the user experience differs

* **Progressive rendering**: you can display text as it arrives (“typing”), instead of waiting for a complete response.
* **Visible work**: in tool/MCP workflows, you can show status updates (e.g., “Searching Ticketmaster…”) while the agent is calling tools.
* **Interruptibility**: you can stop early (client-side) if the user already has what they need, instead of paying for a full completion.

## When to Stream

Stream when:

* Building chat interfaces where perceived latency matters
* Generating long-form content (articles, code, analysis)
* Running in terminals or logs where progress feedback helps

Don’t stream when:

* You need to parse the complete response before displaying
* Using structured outputs with `.parse()`
* Response time is already fast enough

## Next steps

* **Route across models**: [Handoffs](/sdk/handoffs) — Use fast/strong models by phase
* **Add images last**: [Images & Vision](/sdk/images) — Add multimodality when your text workflow is solid
* **See patterns**: [Use Cases](/sdk/use-cases/web-search-agent) — More streaming agent examples

<Tip>
  [Connect these docs programmatically](/contextual/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
</Tip> > ## Documentation Index
> Fetch the complete documentation index at: https://docs.dedaluslabs.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Handoffs

> Route tasks to different models based on their strengths

Different models excel at different tasks. GPT handles reasoning and tool use well. Claude writes better prose. Specialized models exist for code, math, and domain-specific work. Handoffs let agents route subtasks to the right model.

If you’ve already built an MCP + tools workflow, handoffs let you keep a fast “coordinator” model most of the time and route to stronger models only when needed.

<CodeGroup>
  ```python Python theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import asyncio
  from dedalus_labs import AsyncDedalus, DedalusRunner
  from dotenv import load_dotenv

  load_dotenv()

  async def main():
      client = AsyncDedalus()
      runner = DedalusRunner(client)

      result = await runner.run(
          input=(
              "Find me the nearest basketball games in January in San Francisco, then write a concise plan for attending."
          ),
          model=["openai/gpt-5.2", "anthropic/claude-opus-4-5"],
          mcp_servers=["windsor/ticketmaster-mcp"],  # Discover events via Ticketmaster
      )

      print(result.final_output)

  if __name__ == "__main__":
      asyncio.run(main())
  ```

  ```typescript TypeScript theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import Dedalus from 'dedalus-labs';
  import { DedalusRunner } from 'dedalus-labs';

  const client = new Dedalus();
  const runner = new DedalusRunner(client);

  async function main() {
    const result = await runner.run({
      input:
        'Find me the nearest basketball games in January in San Francisco, then write a concise plan for attending.',
      model: ['openai/gpt-5.2', 'anthropic/claude-opus-4-5'],
      mcpServers: ['windsor/ticketmaster-mcp'], // Discover events via Ticketmaster
    });

    console.log((result as any).finalOutput);
  }

  main();
  ```
</CodeGroup>

## When to Use Handoffs

Handoffs shine when a task has distinct phases requiring different capabilities:

* **Research → Writing**: GPT gathers information, Claude writes the final piece
* **Analysis → Code**: A reasoning model plans the approach, a code model implements it
* **Triage → Specialist**: A general model routes to domain-specific models

For simple tasks where one model handles everything, stick to a single model.

## Model Strengths

A rough guide to model selection:

| Task                    | Good Models                                       |
| ----------------------- | ------------------------------------------------- |
| Tool calling, reasoning | `openai/gpt-5.2`, `xai/grok-4-1-fast-reasoning`   |
| Writing, creative work  | `anthropic/claude-opus-4-5`                       |
| Code generation         | `anthropic/claude-opus-4-5`, `openai/gpt-5-codex` |
| Fast, cheap responses   | `gpt-5-mini`                                      |

## Next steps

* **Add multimodality**: [Images & Vision](/sdk/images) — Add image generation/vision to your workflow
* **See workflows**: [Use Cases](/sdk/use-cases/data-analyst) — Multi-capability patterns

<Tip icon="terminal" iconType="regular">
  [Connect these docs programmatically](/contextual/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
</Tip> > ## Documentation Index
> Fetch the complete documentation index at: https://docs.dedaluslabs.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Images & Vision

> Generate, edit, and analyze images

Generate images with DALL-E, create variations, apply edits, and analyze images with vision models. All through the same unified client.

<Tip>
  For image generation, use `openai/dall-e-3` for best quality. For vision tasks, `openai/gpt-5.2` provides excellent performance.
</Tip>

## Progressive example: add images to your workflow

If you’ve already built a text-based agent (Chat → Tools → MCP → Streaming), images are usually the next capability you add:

1. **Generate** an image from a prompt
2. **Edit / vary** an existing image
3. **Analyze** an image with a vision model

The sections below start with the simplest call (generation), then layer on editing and vision.

## Image Generation

Generate images from text prompts using DALL-E models.

<CodeGroup>
  ```python Python theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import asyncio
  from dedalus_labs import AsyncDedalus
  from dotenv import load_dotenv

  load_dotenv()

  async def generate_image():
      """Generate image from text."""
      client = AsyncDedalus()
      response = await client.images.generate(
          prompt="Dedalus flying through clouds",
          model="openai/dall-e-3",
      )
      print(response.data[0].url)

  if __name__ == "__main__":
      asyncio.run(generate_image())
  ```

  ```typescript TypeScript theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import Dedalus from 'dedalus-labs';
  import * as dotenv from 'dotenv';

  dotenv.config();

  async function generateImage() {
    const client = new Dedalus();
    const response = await client.images.generate({
      prompt: 'Dedalus flying through clouds',
      model: 'openai/dall-e-3',
    });
    console.log(response.data[0].url);
  }

  generateImage();
  ```
</CodeGroup>

## Image Editing

Edit existing images by providing a source image, mask, and prompt describing desired changes.

<CodeGroup>
  ```python Python theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import asyncio
  import httpx
  from dedalus_labs import AsyncDedalus
  from dotenv import load_dotenv

  load_dotenv()

  async def edit_image():
      """Edit image (using generated image as both source and mask)."""

      client = AsyncDedalus()

      # Generate a test image (DALL·E output is valid RGBA PNG)
      gen_response = await client.images.generate(
          prompt="A white cat on a cushion",
          model="openai/dall-e-2",
          size="512x512",
      )

      # Download generated image
      async with httpx.AsyncClient() as http:
          img_data = await http.get(gen_response.data[0].url)
          img_bytes = img_data.content

      # Use same image as both source and mask (just testing endpoint works)
      response = await client.images.edit(
          image=img_bytes,
          mask=img_bytes,
          prompt="A white cat with sunglasses",
          model="openai/dall-e-2",
      )
      print(response.data[0].url)

  if __name__ == "__main__":
      asyncio.run(edit_image())
  ```

  ```typescript TypeScript theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import Dedalus, { toFile } from 'dedalus-labs';
  import * as dotenv from 'dotenv';

  dotenv.config();

  async function editImage() {
    const client = new Dedalus();

    // Generate a test image (DALL·E output is valid RGBA PNG)
    const genResponse = await client.images.generate({
      prompt: 'A white cat on a cushion',
      model: 'openai/dall-e-2',
      size: '512x512',
    });

    // Download generated image
    const imageUrl = genResponse.data[0].url;
    if (!imageUrl) throw new Error('No image URL returned');
    const imageResponse = await fetch(imageUrl);
    const imgBytes = Buffer.from(await imageResponse.arrayBuffer());

    // Use same image as both source and mask (just testing endpoint works)
    const response = await client.images.edit({
      image: await toFile(imgBytes, 'source.png'),
      mask: await toFile(imgBytes, 'mask.png'),
      prompt: 'A white cat with sunglasses',
      model: 'openai/dall-e-2',
    });
    console.log(response.data[0].url);
  }

  editImage();
  ```
</CodeGroup>

## Image Variations

Create variations of an existing image.

<CodeGroup>
  ```python Python theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import asyncio
  from pathlib import Path
  from dedalus_labs import AsyncDedalus
  from dotenv import load_dotenv

  load_dotenv()

  async def create_variations():
      """Create image variations."""
      client = AsyncDedalus()

      image_path = Path("image.png")
      if not image_path.exists():
          print("Skipped: image.png not found")
          return

      response = await client.images.create_variation(
          image=image_path.read_bytes(),
          model="openai/dall-e-2",
          n=2,
      )
      for img in response.data:
          print(img.url)

  if __name__ == "__main__":
      asyncio.run(create_variations())
  ```

  ```typescript TypeScript theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import Dedalus, { toFile } from 'dedalus-labs';
  import * as fs from 'fs';
  import * as path from 'path';
  import * as dotenv from 'dotenv';

  dotenv.config();

  async function createVariations() {
    const client = new Dedalus();

    const imagePath = path.join(process.cwd(), 'image.png');
    if (!fs.existsSync(imagePath)) {
      console.log('Skipped: image.png not found');
      return;
    }

    const response = await client.images.createVariation({
      image: await toFile(fs.readFileSync(imagePath), 'image.png'),
      model: 'openai/dall-e-2',
      n: 2,
    });
    for (const img of response.data) {
      console.log(img.url);
    }
  }

  createVariations();
  ```
</CodeGroup>

## Vision: Analyze Images from URL

Use vision models to analyze and describe images from URLs.

<CodeGroup>
  ```python Python theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import asyncio
  from dedalus_labs import AsyncDedalus
  from dotenv import load_dotenv

  load_dotenv()

  async def vision_url():
      """Analyze image from URL."""
      client = AsyncDedalus()
      completion = await client.chat.completions.create(
          model="openai/gpt-5.2",
          messages=[
              {
                  "role": "user",
                  "content": [
                      {"type": "text", "text": "What's in this image?"},
                      {
                          "type": "image_url",
                          "image_url": {"url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"},
                      },
                  ],
              }
          ],
      )
      print(completion.choices[0].message.content)

  if __name__ == "__main__":
      asyncio.run(vision_url())
  ```

  ```typescript TypeScript theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import Dedalus from 'dedalus-labs';
  import * as dotenv from 'dotenv';

  dotenv.config();

  async function visionUrl() {
    const client = new Dedalus();
    const completion = await client.chat.completions.create({
      model: 'openai/gpt-5.2',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: "What's in this image?" },
            {
              type: 'image_url',
              image_url: {
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg',
              },
            },
          ],
        },
      ],
    });
    console.log(completion.choices[0].message.content);
  }

  visionUrl();
  ```
</CodeGroup>

## Vision: Analyze Local Images with Base64

Analyze local images by encoding them as base64.

<CodeGroup>
  ```python Python theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import asyncio
  import base64
  from pathlib import Path
  from dedalus_labs import AsyncDedalus
  from dotenv import load_dotenv

  load_dotenv()

  async def vision_base64():
      """Analyze local image via base64."""
      client = AsyncDedalus()

      image_path = Path("image.png")
      if not image_path.exists():
          print("Skipped: image.png not found")
          return

      b64 = base64.b64encode(image_path.read_bytes()).decode()
      completion = await client.chat.completions.create(
          model="openai/gpt-5.2",
          messages=[
              {
                  "role": "user",
                  "content": [
                      {"type": "text", "text": "Describe this image."},
                      {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                  ],
              }
          ],
      )
      print(completion.choices[0].message.content)

  if __name__ == "__main__":
      asyncio.run(vision_base64())
  ```

  ```typescript TypeScript theme={"theme":{"light":"github-light","dark":"github-dark"}}
  import Dedalus from 'dedalus-labs';
  import * as fs from 'fs';
  import * as path from 'path';
  import * as dotenv from 'dotenv';

  dotenv.config();

  async function visionBase64() {
    const client = new Dedalus();

    const imagePath = path.join(process.cwd(), 'image.png');
    if (!fs.existsSync(imagePath)) {
      console.log('Skipped: image.png not found');
      return;
    }

    const b64 = fs.readFileSync(imagePath).toString('base64');
    const completion = await client.chat.completions.create({
      model: 'openai/gpt-5.2',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
          ],
        },
      ],
    });
    console.log(completion.choices[0].message.content);
  }

  visionBase64();
  ```
</CodeGroup>

## Advanced: Image Orchestration with DedalusRunner

Create complex image workflows by combining generation, editing, and vision capabilities using DedalusRunner.

```python Python theme={"theme":{"light":"github-light","dark":"github-dark"}}
import asyncio
import httpx
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv

load_dotenv()

class ImageToolSuite:
    """Helper that exposes image endpoints as DedalusRunner tools."""

    def __init__(self, client: AsyncDedalus):
        self._client = client

    async def generate_concept_art(
        self,
        prompt: str,
        model: str = "openai/dall-e-3",
        size: str = "1024x1024",
    ) -> str:
        """Create concept art and return the hosted image URL."""
        response = await self._client.images.generate(
            prompt=prompt,
            model=model,
            size=size,
        )
        return response.data[0].url

    async def edit_concept_art(
        self,
        prompt: str,
        reference_url: str,
        mask_url: str | None = None,
        model: str = "openai/dall-e-2",
    ) -> str:
        """Apply edits to the referenced image URL and return a new URL."""

        if not reference_url:
            raise ValueError("reference_url must be provided when editing an image.")

        async with httpx.AsyncClient() as http:
            base_image = await http.get(reference_url)
            mask_bytes = await http.get(mask_url) if mask_url else None

        edit_kwargs = {
            "image": base_image.content,
            "prompt": prompt,
            "model": model,
        }
        if mask_bytes:
            edit_kwargs["mask"] = mask_bytes.content

        response = await self._client.images.edit(**edit_kwargs)
        return response.data[0].url

    async def describe_image(
        self,
        image_url: str,
        question: str = "Describe this image.",
        model: str = "openai/gpt-5.2",
    ) -> str:
        """Run a lightweight vision pass against an existing image URL."""
        completion = await self._client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": question},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ],
        )
        return completion.choices[0].message.content

async def runner_storyboard():
    """Demonstrate DedalusRunner + agent-as-tool pattern for image workflows."""

    client = AsyncDedalus()
    runner = DedalusRunner(client, verbose=True)
    image_tools = ImageToolSuite(client)

    instructions = (
        "You are a creative director. Use the provided tools to generate concept art, "
        "optionally refine it, and then describe the final render. Always keep the "
        "main conversation on a text model and rely on the tools for image work."
    )

    result = await runner.run(
        instructions=instructions,
        input="Create a retro Dedalus mission patch, refine it with a neon palette, and describe it.",
        model="openai/gpt-5.2",
        tools=[
            image_tools.generate_concept_art,
            image_tools.edit_concept_art,
            image_tools.describe_image,
        ],
        max_steps=4,
        verbose=True,
        debug=False,
    )

    print("Runner final output:", result.final_output)
    print("Tools invoked:", result.tools_called)

if __name__ == "__main__":
    asyncio.run(runner_storyboard())
```

## Next steps

* **See end-to-end agents**: [Use Cases](/sdk/use-cases/data-analyst) — Multimodal patterns
* **Deploy your own MCP server**: [MCP quickstart](/dmcp/quickstart) — Host your own tools for your agent
* **Build a chat server**: [Cookbook: Chat server](/sdk/cookbook/chat-server) — Serve your agent in production

<Tip>
  [Connect these docs programmatically](/contextual/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
</Tip>