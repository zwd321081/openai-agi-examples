# 结构化输出

### JSON Schema vs JSON Mode

JSON schema [定义](https://json-schema.org/learn/miscellaneous-examples)

例子

```json
{
  "$id": "https://example.com/complex-object.schema.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Complex Object",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "age": {
      "type": "integer",
      "minimum": 0
    },
    "address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "city": {
          "type": "string"
        },
        "state": {
          "type": "string"
        },
        "postalCode": {
          "type": "string",
          "pattern": "\\d{5}"
        }
      },
      "required": ["street", "city", "state", "postalCode"]
    },
    "hobbies": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": ["name", "age"]
}

```

JSON Mode 对象

```json
{
  "name": "John Doe",
  "age": 25,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001"
  },
  "hobbies": ["reading", "running"]
}

```

官方推荐 结构化输出

```
We recommend always using Structured Outputs instead of JSON mode when possible.

```

## 使用的2种方式

### Function calling

tools属性设置`strict: true`,所有模型都支持`gpt-4-0613`,`gpt-3.5-turbo-0613` 以及之后。

```JSON
POST /v1/chat/completions
{
  "model": "gpt-4o-2024-08-06",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant. The current date is August 6, 2024. You help users query for the data they are looking for by calling the query function."
    },
    {
      "role": "user",
      "content": "look up all my orders in may of last year that were fulfilled but not delivered on time"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "query",
        "description": "Execute a query.",
        "strict": true,
        "parameters": {
          "type": "object",
          "properties": {
            "table_name": {
              "type": "string",
              "enum": ["orders"]
            },
            "columns": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": [
                  "id",
                  "status",
                  "expected_delivery_date",
                  "delivered_at",
                  "shipped_at",
                  "ordered_at",
                  "canceled_at"
                ]
              }
            },
            "conditions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "column": {
                    "type": "string"
                  },
                  "operator": {
                    "type": "string",
                    "enum": ["=", ">", "<", ">=", "<=", "!="]
                  },
                  "value": {
                    "anyOf": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "number"
                      },
                      {
                        "type": "object",
                        "properties": {
                          "column_name": {
                            "type": "string"
                          }
                        },
                        "required": ["column_name"],
                        "additionalProperties": false
                      }
                    ]
                  }
                },
                "required": ["column", "operator", "value"],
                "additionalProperties": false
              }
            },
            "order_by": {
              "type": "string",
              "enum": ["asc", "desc"]
            }
          },
          "required": ["table_name", "columns", "conditions", "order_by"],
          "additionalProperties": false
        }
      }
    }
  ]
}
```



### response_format 选项

请求接口里面添加 `response_format`,`type`设置为`json_schema`,`strict`设置为`true`

```JSON
POST /v1/chat/completions
{
  "model": "gpt-4o-2024-08-06",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful math tutor."
    },
    {
      "role": "user",
      "content": "solve 8x + 31 = 2"
    }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "math_response",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "steps": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "explanation": {
                  "type": "string"
                },
                "output": {
                  "type": "string"
                }
              },
              "required": ["explanation", "output"],
              "additionalProperties": false
            }
          },
          "final_answer": {
            "type": "string"
          }
        },
        "required": ["steps", "final_answer"],
        "additionalProperties": false
      }
    }
  }
}
```

## 具体代码

1. function-calling: fc.ts
2. response-format: rf.ts


## 限制

1. 只允许一部分 JSON Schema：String、Number、Boolean、Object、Array、Enum、anyOf，不支持oneOf 和 allOf
2. 所有字段都是必选的，不能可选
3. 嵌套不能超过5层，不能超过100个属性
4. 一些保留字不能作为属性名，比如字符串类型不能用minLength、maxLength等
5. 第一个带有新Schema的API响应将产生额外的延迟，后续会缓存，一般延迟不会超过 10 秒，但复杂的Schema可能需要长达一分钟的预处理时间
6. 结构化输出并不能防止所有类型的模型错误。例如，模型仍可能在JSON对象的值中犯错误（例如，在数学方程中步骤出错）。如果出错，建议在提示词中提供示例或将任务拆分为更简单的子任务。
7. 如果超过最长等，会失败。


## 推理能力是否会降低

1. [降低](https://arxiv.org/abs/2408.02442): we observe a significant decline in LLMs' reasoning abilities under format restrictions
2. [提高](https://blog.dottxt.co/performance-gsm8k.html)



## 资料
- [介绍](https://openai.com/index/introducing-structured-outputs-in-the-api/)
- [api usage](https://platform.openai.com/docs/guides/structured-outputs/introduction?lang=node.js&context=ex1)
- [zod](https://www.npmjs.com/package/zod)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [tsx](https://tsx.is/getting-started)

