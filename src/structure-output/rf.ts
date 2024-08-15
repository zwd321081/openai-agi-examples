
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

import 'dotenv/config'

const apiKey = process.env.OPENAI_KEY;
const baseURL = process.env.BASEURL;


const Step = z.object({
    explanation: z.string(),
    output: z.string(),
})

const MathResponse = z.object({
    steps: z.array(Step),
    final_answer: z.string(),
})


const client = new OpenAI({
    apiKey,
    baseURL
});

const completion = await client.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [
        {
            "role": "system",
            "content": "You are a helpful math tutor. Only use the schema for math responses.",
        },
        { "role": "user", "content": "solve 8x + 3 = 21" },
    ],
    response_format: zodResponseFormat(MathResponse, 'mathResponse'),
});

const message = completion.choices[0]?.message;
if (message?.parsed) {
    console.log(message.parsed.steps);
    console.log(message.parsed.final_answer);
} else {
    console.log(message.refusal);
}