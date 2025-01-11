import {
  FunctionDeclarationSchemaType,
  type GenerateContentRequest,
  HarmBlockThreshold,
  HarmCategory,
  type Tool,
  VertexAI,
} from "@google-cloud/vertexai";
import * as dotenv from "dotenv";

dotenv.config();

const { PROJECT_ID, REGION } = process.env;

// モデルの情報を指定する。
const textModel = "gemini-1.0-pro";
const visionModel = "gemini-1.0-pro-vision";

// VertexAIインスタンスを作成。
const vertexAI = new VertexAI({
  project: PROJECT_ID as string,
  location: REGION as string,
});

// Instantiate Gemini models
const generativeModel = vertexAI.getGenerativeModel({
  model: textModel,
  // The following parameters are optional
  // They can also be passed to individual content generation requests
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
  generationConfig: {
    maxOutputTokens: 256,
  },
  systemInstruction: {
    role: "system",
    parts: [
      {
        text: "For example, you are a helpful customer service agent.",
      },
    ],
  },
});

const generativeVisionModel = vertexAI.getGenerativeModel({
  model: visionModel,
});

// プレビュー機能を試すインスタンス
const generativeModelPreview = vertexAI.preview.getGenerativeModel({
  model: textModel,
});

/**
 * ストリーミングで出力させるサンプルメソッド
 */
export async function streamGenerateContent() {
  const request = {
    contents: [
      {
        role: "user",
        parts: [{ text: "How are you doing today?" }],
      },
    ],
  };
  // ストリーミングで出力
  const streamingResult = await generativeModel.generateContentStream(request);

  for await (const item of streamingResult.stream) {
    console.log("stream chunk: ", JSON.stringify(item));
  }
  const aggregatedResponse = await streamingResult.response;
  console.log("aggregated response: ", JSON.stringify(aggregatedResponse));

  return JSON.stringify(aggregatedResponse);
}

/**
 * ストリーミングなしで出力するメソッド
 */
export async function generateContent() {
  const request = {
    contents: [
      {
        role: "user",
        parts: [{ text: "How are you doing today?" }],
      },
    ],
  };
  // ストリーミングなしで出力
  const result = await generativeModel.generateContent(request);
  const response = result.response;
  console.log("Response: ", JSON.stringify(response));

  return JSON.stringify(response);
}

/**
 * ストリーミングに対応したチャットメソッド
 */
export async function streamChat() {
  // チャット開始
  const chat = generativeModel.startChat();
  const chatInput = "How can I learn more about Node.js?";
  const result = await chat.sendMessageStream(chatInput);
  // 結果を取り出す。
  for await (const item of result.stream) {
    console.log("Stream chunk: ", item.candidates?.[0].content.parts[0].text);
  }
  const aggregatedResponse = await result.response;
  console.log("Aggregated response: ", JSON.stringify(aggregatedResponse));

  return JSON.stringify(aggregatedResponse);
}

/**
 * ストリーミングに対応していないチャットメソッド
 */
export async function sendChat() {
  // チャット開始
  const chat = generativeModel.startChat();
  const chatInput = "How can I learn more about Node.js?";
  const result = await chat.sendMessage(chatInput);
  // 結果を取り出す。
  const response = result.response;
  console.log("response: ", JSON.stringify(response));

  return JSON.stringify(response);
}

/**
 * multiPartコンテンツ生成メソッド
 */
export async function multiPartContent() {
  // ファイルデータ
  const filePart = {
    fileData: {
      fileUri: "gs://generativeai-downloads/images/scones.jpg",
      mimeType: "image/jpeg",
    },
  };
  // テキストデータ
  const textPart = { text: "What is this picture about?" };
  // リクエストデータ
  const request = {
    contents: [
      {
        role: "user",
        parts: [textPart, filePart],
      },
    ],
  };
  // コンテンツ生成
  const streamingResult =
    await generativeVisionModel.generateContentStream(request);
  for await (const item of streamingResult.stream) {
    console.log("stream chunk: ", JSON.stringify(item));
  }
  const aggregatedResponse = await streamingResult.response;
  console.log(aggregatedResponse.candidates?.[0].content);

  return JSON.stringify(aggregatedResponse);
}

/**
 * base64でエンコードされた画像データで検証するメソッド
 */
export async function multiPartContentImageString() {
  // Replace this with your own base64 image string
  const base64Image =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const filePart = {
    inline_data: { data: base64Image, mimeType: "image/jpeg" },
  };
  const textPart = { text: "What is this picture about?" };
  // リクエストデータ
  const request = {
    contents: [{ role: "user", parts: [textPart, filePart] }],
  };
  // コンテンツ生成
  const streamingResult = await generativeVisionModel.generateContentStream(
    request as GenerateContentRequest,
  );
  const contentResponse = await streamingResult.response;
  console.log(contentResponse.candidates?.[0].content.parts[0].text);

  return JSON.stringify(contentResponse);
}

/**
 * 映像を入力データについて出力させるサンプルメソッド
 */
export async function multiPartContentVideo() {
  const filePart = {
    fileData: {
      fileUri: "gs://cloud-samples-data/video/animals.mp4",
      mimeType: "video/mp4",
    },
  };
  const textPart = { text: "What is in the video?" };
  // リクエストデータ
  const request = {
    contents: [{ role: "user", parts: [textPart, filePart] }],
  };
  // コンテンツ生成
  const streamingResult =
    await generativeVisionModel.generateContentStream(request);
  for await (const item of streamingResult.stream) {
    console.log("stream chunk: ", JSON.stringify(item));
  }
  const aggregatedResponse = await streamingResult.response;
  console.log(aggregatedResponse.candidates?.[0].content);

  return JSON.stringify(aggregatedResponse);
}

const functionDeclarations = [
  {
    functionDeclarations: [
      {
        name: "get_current_weather",
        description: "get weather in a given location",
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            location: { type: FunctionDeclarationSchemaType.STRING },
            unit: {
              type: FunctionDeclarationSchemaType.STRING,
              enum: ["celsius", "fahrenheit"],
            },
          },
          required: ["location"],
        },
      },
    ],
  },
];

// レスポンスの定義
const functionResponseParts = [
  {
    functionResponse: {
      name: "get_current_weather",
      response: {
        name: "get_current_weather",
        content: { weather: "super nice" },
      },
    },
  },
];

/**
 * 連続してメソッドを呼び出す。
 */
export async function functionCallingChat() {
  // Create a chat session and pass your function declarations
  const chat = generativeModel.startChat({
    tools: functionDeclarations,
  });

  const chatInput1 = "What is the weather in Boston?";

  // This should include a functionCall response from the model
  const streamingResult1 = await chat.sendMessageStream(chatInput1);
  for await (const item of streamingResult1.stream) {
    console.log(item.candidates?.[0]);
  }
  const response1 = await streamingResult1.response;
  console.log("first aggregated response: ", JSON.stringify(response1));

  // Send a follow up message with a FunctionResponse
  const streamingResult2 = await chat.sendMessageStream(functionResponseParts);
  for await (const item of streamingResult2.stream) {
    console.log(item.candidates?.[0]);
  }

  // This should include a text response from the model using the response content
  // provided above
  const response2 = await streamingResult2.response;
  console.log("second aggregated response: ", JSON.stringify(response2));

  return JSON.stringify(response2);
}

/**
 * ストリーミングありでコンテンツを生成させるメソッド
 */
export async function functionCallingGenerateContentStream() {
  // リクエストデータ
  const request = {
    contents: [
      { role: "user", parts: [{ text: "What is the weather in Boston?" }] },
      {
        role: "model",
        parts: [
          {
            functionCall: {
              name: "get_current_weather",
              args: { location: "Boston" },
            },
          },
        ],
      },
      { role: "user", parts: functionResponseParts },
    ],
    tools: functionDeclarations,
  };
  const streamingResult = await generativeModel.generateContentStream(request);
  for await (const item of streamingResult.stream) {
    console.log(item.candidates?.[0]);
  }

  return JSON.stringify(streamingResult);
}

/**
 * トークン数を数えるメソッド
 */
export async function countTokens() {
  const request = {
    contents: [{ role: "user", parts: [{ text: "How are you doing today?" }] }],
  };
  const response = await generativeModel.countTokens(request);
  console.log("count tokens response: ", JSON.stringify(response));

  return JSON.stringify(response);
}

/**
 * generateContentWithGoogleSearchGrounding(プレビュー)
 */
export async function generateContentWithGoogleSearchGrounding() {
  // プレビュー機能を試すようにインスタンスを生成。
  const generativeModelPreview = vertexAI.preview.getGenerativeModel({
    model: textModel,
    // The following parameters are optional
    // They can also be passed to individual content generation requests
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
    generationConfig: { maxOutputTokens: 256 },
  });

  // Google Search の設定
  const googleSearchRetrievalTool = {
    googleSearchRetrieval: {
      disableAttribution: false,
    },
  };
  // アウトプットを出力させる。
  const result = await generativeModelPreview.generateContent({
    contents: [{ role: "user", parts: [{ text: "Why is the sky blue?" }] }],
    tools: [googleSearchRetrievalTool as Tool],
  });
  const response = result.response;
  const groundingMetadata = response.candidates?.[0].groundingMetadata;
  console.log("GroundingMetadata is: ", JSON.stringify(groundingMetadata));
}

/**
 * VertexAIでグランディングを行う検証用のコード
 */
export async function generateContentWithVertexAISearchGrounding() {
  // プレビュー機能を試すために設定する。
  const generativeModelPreview = vertexAI.preview.getGenerativeModel({
    model: textModel,
    // The following parameters are optional
    // They can also be passed to individual content generation requests
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
    generationConfig: { maxOutputTokens: 256 },
  });
  // Vertex AI検索の設定
  const vertexAIRetrievalTool = {
    retrieval: {
      vertexAiSearch: {
        datastore: "projects/.../locations/.../collections/.../dataStores/...",
      },
      disableAttribution: false,
    },
  };
  const result = await generativeModelPreview.generateContent({
    contents: [{ role: "user", parts: [{ text: "Why is the sky blue?" }] }],
    tools: [vertexAIRetrievalTool],
  });
  const response = result.response;
  const groundingMetadata = response.candidates?.[0].groundingMetadata;
  console.log("Grounding metadata is: ", JSON.stringify(groundingMetadata));
}
