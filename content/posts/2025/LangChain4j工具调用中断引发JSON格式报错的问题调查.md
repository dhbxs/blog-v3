---
title: LangChain4j工具调用中断引发JSON格式报错的问题调查
description: '本文记录了在使用LangChain4j集成AI服务时遇到的400错误问题排查过程。开发者在测试工具链功能时，因中断AI回复导致会话历史格式错误，引发大模型服务商报错。通过分析错误日志和工具调用流程，最终确定是中断会话导致的历史记录格式问题。文章详细记录了从错误表象到深层原因的分析过程，并附上工具调用流程图帮助理解问题本质。'
date: 2025-11-01 16:37:52
updated: 2025-11-01 16:37:52
image: https://file.dhbxs.top/2025/11/hhaqfien.webp
permalink: /posts/4c27c0e
categories: [开发]
tags: [AI应用开发,LLM,LangChain4j]
recommend: 2
---

## 背景
### 依赖版本
- JDK: 21
- SpringBoot: 3.5.4
- LangChain4j: 1.1.0
- LangChain4j-open-ai-spring-boot-starter: 1.1.0-beta7
- LangChain4j-reactor: 1.1.0-beta7
- LangChain4j-community-redis-spring-boot-starter: 1.1.0-beta7

### 问题发生过程
1. 本地编写好工具链，并注册到LangChain4j的AIService中
2. 然后编写测试类，测试验证功能
3. 在调用AI大模型等待回复的过程中，中断了回复，模拟用户在使用应用过程中因网络环境等因素导致中断
4. 携带会话历史记录再次请求大模型时，始终报错400

> 第3点和第4点是后来找到报错原因后才知道的，一开始并不了解

### 报错信息

#### LangChain4j报错

本地 LangChain4j 报错信息如下：
```java
dev.langchain4j.exception.InvalidRequestException: {"error":{"code":"invalid_parameter_error","param":null,"message":"<400> InternalError.Algo.InvalidParameter: The \"function.arguments\" parameter of the code model must be in JSON format.","type":"invalid_request_error"},"id":"chatcmpl-e8f6616b-f52b-4a64-be71-4c9d44841840","request_id":"e8f6616b-f52b-4a64-be71-4c9d44841840"}

	at dev.langchain4j.internal.ExceptionMapper$DefaultExceptionMapper.mapHttpStatusCode(ExceptionMapper.java:71)
	at dev.langchain4j.internal.ExceptionMapper$DefaultExceptionMapper.mapException(ExceptionMapper.java:44)
	at dev.langchain4j.model.openai.OpenAiStreamingChatModel.lambda$doChat$4(OpenAiStreamingChatModel.java:145)
	at dev.langchain4j.model.openai.internal.StreamingRequestExecutor$2.onError(StreamingRequestExecutor.java:125)
	at dev.langchain4j.http.client.log.LoggingHttpClient$1.onError(LoggingHttpClient.java:75)
	at dev.langchain4j.http.client.spring.restclient.SpringRestClient.lambda$execute$1(SpringRestClient.java:102)
	at dev.langchain4j.http.client.sse.ServerSentEventListenerUtils.ignoringExceptions(ServerSentEventListenerUtils.java:14)
	at dev.langchain4j.http.client.spring.restclient.SpringRestClient.lambda$execute$3(SpringRestClient.java:102)
	at org.springframework.web.client.DefaultRestClient$DefaultRequestBodyUriSpec.exchangeInternal(DefaultRestClient.java:586)
	at org.springframework.web.client.DefaultRestClient$DefaultRequestBodyUriSpec.exchange(DefaultRestClient.java:540)
	at org.springframework.web.client.RestClient$RequestHeadersSpec.exchange(RestClient.java:680)
	at dev.langchain4j.http.client.spring.restclient.SpringRestClient.lambda$execute$6(SpringRestClient.java:94)
	at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1144)
	at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:642)
	at java.base/java.lang.Thread.run(Thread.java:1583)
	Suppressed: java.lang.Exception: #block terminated with an error
		at reactor.core.publisher.BlockingSingleSubscriber.blockingGet(BlockingSingleSubscriber.java:104)
		at reactor.core.publisher.Mono.block(Mono.java:1779)
		at top.dhbxs.aicode.core.AiCodeGeneratorFacadeTest.testGenerateVueProjectCode(AiCodeGeneratorFacadeTest.java:36)
		at java.base/java.lang.reflect.Method.invoke(Method.java:580)
		at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
		at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
Caused by: dev.langchain4j.exception.HttpException: {"error":{"code":"invalid_parameter_error","param":null,"message":"<400> InternalError.Algo.InvalidParameter: The \"function.arguments\" parameter of the code model must be in JSON format.","type":"invalid_request_error"},"id":"chatcmpl-e8f6616b-f52b-4a64-be71-4c9d44841840","request_id":"e8f6616b-f52b-4a64-be71-4c9d44841840"}
	at dev.langchain4j.http.client.spring.restclient.SpringRestClient.lambda$execute$3(SpringRestClient.java:101)
	... 7 more
```

#### 大模型服务商日志

```json
{
  "error_message": "<400> InternalError.Algo.InvalidParameter: The \"function.arguments\" parameter of the code model must be in JSON format.",
  "start_unix_timestamp": "1762484256433",
  "first_output_duration": "99",
  "status_code": "400",
}
```

## 问题排查过程
### 区分报错源头
初次看到这个报错时，是比较懵的，模型调用的代码，以及工具方法等都有做异常的捕获，这个报错信息提示是 LangChain4j 抛出的异常，然后又看到了关键词 JSON format xxx，以为是模型不支持结构化输出，即response_format 或者是模型只支持 JSON 结构化输出但是代码里没有配置好。

但是 Review 了相关代码，更换了支持JSON结构化输出的模型，配置了结构化输出，报错依然存在。

回头又看了眼报错信息，`dev.langchain4j.exception.InvalidRequestException`， `InvalidRequestException` 这表示是在 LangChain4j 请求大模型接口时报错，仔细想了下，这次本地调试只是测试我新加的工具调用功能，而工具调用本质上是：

1. 先提供给大模型我们的应用支持哪些工具，工具名，工具入参等信息
2. 大模型如果有调用工具的需求，会输出特定格式文本比如json之类的，并提供调用工具所需的参数
3. LangChain4j 框架接收到大模型的输出信息解析后，代替大模型，运行工具方法，并传入大模型提供的参数等
4. 最终 LangChain4j 将调用工具方法的返回值等信息在发送给大模型，让大模型继续后续的流程/输出

这里也附上XX云大模型工具调用 (Function Calling) 的流程图，方便理解：

![工具调用 (Function Calling) 流程图](https://file.dhbxs.top/2025/11/ejhwfdis.svg)

如果是调用工具执行的过程中出错，那一定是我本地代码报错，并没有大模型向接口请求，怎么会有 InvalidRequestException ？

然后登录到XX云的大模型接口后台，找到了调用日志记录，发现 `<400> InternalError.Algo.InvalidParameter: The \"function.arguments\" parameter of the code model must be in JSON format.` 这个信息确实是大模型服务商给出的报错。

所以这个错误是来自大模型服务商。

### 再次理解报错信息
在确认报错信息来自大模型服务商的接口后，再次查看报错信息，`\"function.arguments\" parameter` 关注到了这段关键词。这应该是指 `function.arguments` 请求参数，看了眼控制台的请求记录信息，发现以下内容
```json
{
    "role" : "user",
    "content" : "写个个人主页，不超过50行代码"
}, 
{
    "role" : "assistant",
    "tool_calls" : [ {
      "id" : "call_28e7dc6997c24c4080c943cf",
      "type" : "function",
      "function" : {
        "name" : "writeFile",
        "arguments" : "{\"content\": \"<!DOCTYPE html>\\n<html lang=\\\"zh-CN\\\">\\n<head>\\n  <meta charset=\\\"UTF-8\\\">\\n  <title>个人主页</title>\\n  <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\">\\n  <style>\\n    * { margin: 0; padding: 0; box-sizing: border-box; }\\n    body { font-family: Arial, sans-serif; background-color: #f5f5f5; }\\n    .navbar { background-color: #333; padding: 1rem; display: flex; justify-content: space-between; align-items: center; }\\n    .navbar a { color: white; text-decoration: none; margin: 0 1rem; }\\n    .container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\\n    .hero { text-align: center; padding: 2rem 1rem; background-color: #e9ecef; border-radius: 8px; margin-bottom: 2rem; }\\n    .section { padding: 1rem; }\\n    .section h2 { margin-bottom: 1rem; color: #333; }\\n    .projects { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }\\n    .project-card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; text-align: center; }\\n    .project-card img { width: 100%; height: 150px; object-fit: cover; border-radius: 4px; }\\n  </style>\\n</head>\\n<body>\\n  <div id=\\\"app\\\">\\n    <div class=\\\"navbar\\\">\\n      <h2>我的个人主页</h2>\\n      <nav>\\n        <a href=\\\"#home\\\">首页</a>\\n        <a href=\\\"#about\\\">关于我</a>\\n        <a href=\\\"#projects\\\">项目</a>\\n        <a href=\\\"#contact\\\">联系</a>\\n      </nav>\\n    </div>\\n    \\n    <div class=\\\"container\\\">\\n      <div class=\\\"hero\\\">\\n        <h1>欢迎来到我的个人主页</h1>\\n        <p>这里展示了我的技能、项目和联系方式。</p>\\n      </div>\\n\\n      <div class=\\\"section\\\" id=\\\"about\\\">\\n        <h2>关于我</h2>\\n        <p>我是一名热爱编程的开发者，专注于前端技术。我喜欢学习新技术，并将其应用于实际项目中。</p>\\n      </div>\\n\\n      <div class=\\\"section\\\" id=\\\"projects\\\">\\n        <h2>我的项目</h2>\\n        <div class=\\\"projects\\\">\\n          <div class=\\\"project-card\\\">\\n            <img src=\\\"https://picsum.photos/300/200?random=1\\\" alt=\\\"项目1\\\">\\n            <h3>项目一</h3>\\n            <p>这是一个前端项目，使用Vue.js构建。</p>\\n          </div>\\n          <div class=\\\"project-card\\\">\\n            <img src=\\\"https://picsum.photos/300/200?random=2\\\" alt=\\\"项目2\\\">\\n            <h3>项目二</h3>\\n            <p>一个响应式的电商网站。</p>\\n          </div>\\n          <div class=\\\"project-card\\\">\\n            <img src=\\\"https://picsum.photos/300/200?random=3\\\" alt=\\\"项目3\\\">\\n            <h3>项目三</h3>\\n            <p>基于Node.js的后端API服务。</p>\\n          </div>\\n        </div>\\n      </div>\\n\\n      <div class=\\\"section\\\" id=\\\"contact\\\">\\n        <h2>联系我</h2>\\n        <p>邮箱: example@example.com</p>\\n        <p>GitHub: <a href=\\\"https://github.com/example\\\">github.com/example</a></p>\\n      </div>\\n    </div>\\n  </div>\\n</body>\\n\""
      }
    } ]
  }
```
这里不就有报错中的 `function.arguments` 嘛，来瞅瞅这个 `arguments` 里到底有啥导致了报错。

这个参数是角色(role)为 `assistant` 的答复记录，LangChain4j 里的 assistant 就指的是AI大模型，也就是说AI大模型的响应结果，还是历史响应结果，因为新的响应结果还没看到，这是第一次向大模型提问的记录，第二次就报错了。

报错信息里提示 `must be in JSON format` 也就是说这个参数必须是JSON格式。我单独把这个 `arguments` 的值去掉引号粘贴到VSCode中看了眼，好家伙！！！

最后一段字符`</body>\\n\"`这JSON对象的反括号哪里去了？

所以是这个参数的值没有通过模型服务商的请求校验，导致最终报400请求错误。

### 是什么导致JSON语法校验不通过
知道了问题的关键，那新问题又来了，为什么？

这个历史消息记录是大模型给的回答，难道大模型自己回答错了嘛？

如果是大模型输出错误，必然在第一次调用工具的时候就报错，不会在第二次继续向大模型提问时才报错。
这时候突然想到，第一次调试时，我中断了debug过程，修改了一些代码，然后启动了第二次debug，所以第一次大模型的响应没有完整的保存到 Redis，会话历史记录是有残缺的。

为了验证，清除了所有会话历史记录，重新debug，发现这次成功了，没有报任何错。

然后手动修改 Redis 会话历史记录，删除部分 `arguments` 中的值，再次debug，问题复现。

### 咨询模型服务商
仔细想了下，有了新的问题，为什么大模型服务商会校验历史会话记录中大模型自己输出的调用工具的会话信息，这会不会是大模型服务商的Bug呢？

在咨询后，可以确定，确实有校验所有输入参数，所有会话上下文记录，不过并没有得知为什么会校验 大模型调用工具历史记录中的JSON语法是否合法。

校验这个参数的必要性存疑。<mark>如果有大佬了解，欢迎评论区交流。</mark>

## 解决方法

1. 最简单的就是发生错误后，清空所有聊天记录上下文，重新发起新的会话。
2. 在用户中断聊天，或各种因素导致的中断后，可以把整条工具链调用记录都删除，即：role: "assistant" 里带 tool_calls 的消息，role: "tool" 里带 tool_call_id 的消息。
3. 重建上下文。

还是建议重建上下文，就是把用户的问题，大模型的纯文本内容的回复，重新覆写到会话记录中，这样可以避免因网络等因素导致的用户输入信息丢失或者格式错乱等各种问题，也能一定程度上避免一些大模型幻觉。例如先前的会话中大模型已经调用了工具执行报错了，但是会话上下文中却没有记录到报错信息，在接下来继续对话中，大模型可能会认为之前已经调用成功，后续就不再重复调用了。