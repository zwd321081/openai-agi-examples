import OpenAI from 'openai';
import z from 'zod';
import { zodFunction } from 'openai/helpers/zod';
import 'dotenv/config'

const apiKey = process.env.OPENAI_KEY;
const baseURL = process.env.BASEURL;

const Table = z.enum(['orders', 'customers', 'products']);
const Column = z.enum([
    'id',
    'status',
    'expected_delivery_date',
    'delivered_at',
    'shipped_at',
    'ordered_at',
    'canceled_at',
]);
const Operator = z.enum(['=', '>', '<', '<=', '>=', '!=']);
const OrderBy = z.enum(['asc', 'desc']);

const DynamicValue = z.object({
    column_name: z.string(),
});

const Condition = z.object({
    column: z.string(),
    operator: Operator,
    value: z.union([z.string(), z.number(), DynamicValue]),
});

const QueryArgs = z.object({
    table_name: Table,
    columns: z.array(Column),
    conditions: z.array(Condition),
    order_by: OrderBy,
});

const client = new OpenAI({
    apiKey,
    baseURL
});

const _content = `
You are a helpful assistant. The current date is August 6, 2024. 
You help users query for the data they are looking for by calling the query function.
`

const completion = await client.beta.chat.completions.parse({
    model: 'gpt-3.5-turbo-0125',
    messages: [
        { role: 'system', content: _content },
        { role: 'user', content: 'look up all my orders in may of last year that were fulfilled but not delivered on time' }
    ],
    tools: [zodFunction({ name: 'query', parameters: QueryArgs })],
});
console.log(completion.choices[0].message.tool_calls[0].function.parsed_arguments);



