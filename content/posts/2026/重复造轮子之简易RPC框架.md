---
title: 重复造轮子之简易RPC框架
description: 重复造轮子之实现一个简易的RPC框架，包含服务提供者、消费者、公共模块和RPC核心模块的设计与开发。通过使用Vert.x实现HTTP服务器，JDK序列化处理数据传输，动态代理实现远程调用，实现了类似本地调用的分布式服务通信。
date: 2026-05-02 13:57:49
updated: 2026-05-02 13:57:49
image: https://file.dhbxs.top/blog_img/1777041101667_20260424.webp
permalink: /posts/39924a5
categories: [技术]
tags: [RPC, Java]
recommend: 0
---

## RPC框架
### 什么是 RPC 框架
**RPC（Remote Procedure Call，远程过程调用）** 框架是一种用于实现远程过程调用的软件工具或库。通过RPC框架，开发者可以在分布式系统中，像调用本地函数一样调用远程服务器上的服务。RPC框架负责封装底层的网络通信细节，使得开发者能够以更简单、更高效的方式实现服务之间的调用。

::pic
---
src: https://file.dhbxs.top/blog_img/1777702582565_image.webp
caption: RPC框架架构图
---
::

传统 Java 多模块单体项目需要将各个模块的 jar 包引入，从而实现在 A 模块中调用 B 模块的代码。在 Maven 中通常是父子工程模块，以及兄弟模块直接互相作为依赖导入。


如果是分布式微服务项目的话，多个服务独立部署在多个服务器中，这些独立的服务之间需要互相通信，调用如果没有 RPC 框架，就是通过 HTTP API 接口请求交互，达到互相通信的目的。


这样通过接口调用有个最直观的弊端就是需要服务提供方写好接口，调用方写好接口调用代码，然后才能通信，就像前端调用后端接口获取数据一样，开发者需要自己写接口，写调用的代码，不够高效，而且服务之间的通信延迟不够低，网络开销比较大。因此就出现了 RPC 框架，有了 RPC 框架之后，就可以像本地调用普通方法一样，不需要关心底层网络通信，接口调用等细节，本地怎么调用本地方法，就怎么调用其他微服务方法。

## 代码实现
接下来通过代码来实现一个非常简易的 RPC 框架，先在 IDEA 中创建一个空的模块 dhbxs-rpc，这个模块里分为 4 个子模块，分别是 common（公共模块）、consumer（服务消费者模块）、provider（服务提供者模块）、easy-rpc（rpc 模块）。

::pic
---
src: https://file.dhbxs.top/blog_img/1777702806845_image.webp
caption: 项目总览图
---
::

### 代码结构
common 模块主要是负责定义实体类和公共接口，也就是我们服务提供者提供哪些服务，先在 common 中定义出来，主要是接口，没有实现类，因为具体的实现是提供者的事。这个的 common 模块也就相当于是 RPC 框架中的注册中心。

provider 模块主要是提供服务，也就是实现 common 模块中定义的接口，以及后面我们通过 provider 模块启动 rpc 模块。

consumer 模块就是使用 provider 模块提供的服务，但是 consumer 模块中并不会直接在 Maven 的 pom.xml 中配置依赖于 provider，而是通过 rpc 框架自动调用 provider。

easy-rpc 模块主要就是实现 rpc 框架的基本功能，我们这里除了注册中心以外，基本功能都会实现。

### 各模块依赖
::pic
---
src: https://file.dhbxs.top/blog_img/1777702907529_image.webp
caption: Maven模块依赖关系图
---
::

#### common 模块
```xml [pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns="http://maven.apache.org/POM/4.0.0"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>top.dhbxs.rpc</groupId>
    <artifactId>common</artifactId>
    <version>1.0-SNAPSHOT</version>

</project>
```

#### provider 模块
```xml [pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns="http://maven.apache.org/POM/4.0.0"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>top.dhbxs.rpc</groupId>
    <artifactId>provider</artifactId>
    <version>1.0-SNAPSHOT</version>

    <dependencies>
      <dependency>
            <groupId>top.dhbxs.rpc</groupId>
            <artifactId>common</artifactId>
            <version>1.0-SNAPSHOT</version>
        </dependency>
        <dependency>
            <groupId>top.dhbxs.rpc</groupId>
            <artifactId>easy-rpc</artifactId>
            <version>1.0-SNAPSHOT</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.44</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>

</project>
```

#### consumer 模块
```xml [pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns="http://maven.apache.org/POM/4.0.0"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>top.dhbxs.rpc</groupId>
    <artifactId>consumer</artifactId>
    <version>1.0-SNAPSHOT</version>

    <dependencies>
        <dependency>
            <groupId>top.dhbxs.rpc</groupId>
            <artifactId>easy-rpc</artifactId>
            <version>1.0-SNAPSHOT</version>
        </dependency>
        <dependency>
            <groupId>top.dhbxs.rpc</groupId>
            <artifactId>common</artifactId>
            <version>1.0-SNAPSHOT</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.44</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
```

#### easy-rpc 模块
```xml [pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns="http://maven.apache.org/POM/4.0.0"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>top.dhbxs.rpc</groupId>
    <artifactId>easy-rpc</artifactId>
    <version>1.0-SNAPSHOT</version>

    <dependencies>
        <dependency>
            <groupId>io.vertx</groupId>
            <artifactId>vertx-core</artifactId>
            <version>4.5.1</version>
        </dependency>
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-http</artifactId>
            <version>5.8.44</version>
            <scope>compile</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.44</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>

</project>
```

### 分模块开发
#### common 模块开发
::pic
---
src: https://file.dhbxs.top/blog_img/1777702975942_image.webp
caption: common公共模块
---
::

公共模块主要定义一个 model 包，里面定义一个 User 类，模拟从 RPC 框架拿到的数据对象，这个对象就是消费者要消费的对象。然后是一个 UserService 接口，在这个接口中，就简单定义一个获取 User 对象的方法，提供者需要实现这个接口中的方法。

```java [User.java]
package top.dhbxs.rpc.common.model;

import java.io.Serializable;

/**
 * 用户
 *
 * @author dhbxs
 * @since 2026/4/21
 */
public class User implements Serializable {

    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
```

```java [UserService.java]
package top.dhbxs.rpc.common.service;

import top.dhbxs.rpc.common.model.User;

/**
 * 用户相关服务
 *
 * @author dhbxs
 * @since 2026/4/21
 */
public interface UserService {

    /**
     * 获取用户
     *
     * @param user 用户
     * @return 用户
     */
    User getUser(User user);
}

```

#### provider 模块开发
::pic
---
src: https://file.dhbxs.top/blog_img/1777703061045_image.webp
caption: provider提供者模块
---
::

提供者模块就需要实现公共模块定义的 UserService 接口，目前先忽略 EasyProviderExample 这个类。

```java [UserServiceImpl.java]
package top.dhbxs.rpc.provider;

import top.dhbxs.rpc.common.model.User;
import top.dhbxs.rpc.common.service.UserService;

/**
 * 用户服务实现类
 *
 * @author dhbxs
 * @since 2026/4/21
 */
public class UserServiceImpl implements UserService {
    /**
     * 获取用户
     *
     * @param user 用户
     * @return 用户
     */
    @Override
    public User getUser(User user) {
        System.out.println("用户名：" + user.getName());
        return user;
    }
}

```

#### consumer 模块开发
::pic
---
src: https://file.dhbxs.top/blog_img/1777703087692_image.webp
caption: consumer模块
---
::

消费者模块就是要使用我们公共模块中定义的接口，来获取用户数据。

```java [EasyConsumerExample.java]
package top.dhbxs.rpc.consumer;

import top.dhbxs.rpc.common.model.User;
import top.dhbxs.rpc.common.service.UserService;

/**
 * 简单的服务消费者示例
 *
 * @author dhbxs
 * @since 2026/4/21
 */
public class EasyConsumerExample {

    public static void main(String[] args) {
        UserService userService = null;

        User user = new User();
        user.setName("灯火不休时");

        // 如果没有 RPC 框架，这里调用会报 NPE，因为userService为空，不是实体对象，调用不了方法
        // UserServiceImpl 为服务提供者 provider 模块下的类，当前项目的 pom 也没有直接引入 provider 模块
        // 所以需要 RPC 框架帮我们完成调用
        User newUser = userService.getUser(user);

        if (newUser != null) {
            System.out.println(newUser.getName());
        } else {
            System.out.println("user = null");
        }
    }
}

```

#### easy-rpc 模块开发
::pic
---
src: https://file.dhbxs.top/blog_img/1777703151776_image.webp
caption: easy-rpc模块
---
::

easy-rpc 模块是重点，前文中提到过，rpc 框架是需要通过网络通信实现不同服务之间的通信。所以我们需要 rpc 框架能启动一个 HTTP 服，处理网络请求。这里使用 [Vert.x](https://vertx.io) 这个框架来实现，关于 Vert.x 框架的介绍，参考我和 AI 的对话：


::chat
{:2026-04-26 17:22:00}

{.灯火不休时}

简单介绍Vertx框架

{AI}

Vert.x 是一个事件驱动、非阻塞、轻量级的 Java 全栈应用框架，专为构建高性能、高并发的响应式应用而设计。\
如果你正在处理高并发连接、低延迟要求、资源受限环境（如容器/K8s 中），Vert.x 是非常值得考虑的选择。
::


##### 1) 定义 Vertx HTTP 服务接口
首先定义一个接口，用来启动 Vertx HTTP 服务，在 top.dhbxs.rpc.server 包下

```java [HttpServer.java]
package top.dhbxs.rpc.server;

/**
 * HTTP 服务器接口
 */
public interface HttpServer {

    /**
     * 启动服务器
     *
     * @param port 端口
     */
    void doStart(int port);
}

```

##### 2）实现接口启动 HTTP 服务
实现该接口，启动 HTTP 服务

```java [VertxHttpServer.java]
package top.dhbxs.rpc.server;

import io.vertx.core.Vertx;

/**
 * 基于 Vertx 实现的 web 服务器
 *
 * @author dhbxs
 * @since 2026/4/21
 */
public class VertxHttpServer implements HttpServer {

    /**
     * 启动服务器
     *
     * @param port 端口
     */
    @Override
    public void doStart(int port) {
        // 创建 Vertx 实例
        Vertx vertx = Vertx.vertx();

        // 创建 HTTP 服务器
        io.vertx.core.http.HttpServer server = vertx.createHttpServer();

        server.requestHandler(request -> {
            // 记录请求日志
            System.out.println("Received request: Method: " + request.method() + " URI: " + request.uri());

            // 设置响应内容并返回响应
            request.response().putHeader("content-type", "text/html")
                    .end("<h1>Hello Vert.x HTTP server!</h1>");
        });

        server.listen(port, result -> {
            if (result.succeeded()) {
                System.out.println("Server is now listening on port " + port);
            } else {
                System.out.println("Failed to start server: " + result.cause());
            }
        });
    }
}

```

##### 3）测试 HTTP Server 请求响应
在 provider 模块中的 top.dhbxs.rpc.provider 包下新建一个类，启动刚建好的 HTTP Server 测试能否接收到请求并响应数据

```java [EasyProviderExample.java]
package top.dhbxs.rpc.provider;

import top.dhbxs.rpc.common.service.UserService;
import top.dhbxs.rpc.registry.LocalRegistry;
import top.dhbxs.rpc.server.VertxHttpServer;

/**
 * 简单的服务提供者示例
 *
 * @author dhbxs
 * @since 2026/4/21
 */
public class EasyProviderExample {

    public static void main(String[] args) {

        // 启动 web 服务
        VertxHttpServer vertxHttpServer = new VertxHttpServer();
        vertxHttpServer.doStart(8080);
    }
}

```

然后运行这个 main 方法，启动 Vertx HTTP Server，然后在浏览器访问 http://localhost:8080 查看是否能看到 Hello Vert.x HTTP server! 然后控制台是否能输出如下内容

```log [console.log]
Server is now listening on port 8080
Received request: Method: GET URI: /
```

##### 4）实现本地注册中心
现在 HTTP 服务有了，接下来做一个简易版的注册中心，只在本地注册保存，使用 ConcurrentHashMap 保存注册信息，主要是注册的服务名称(Key)和服务的实现类(Value)。在 provider 模块启动时，需要把它提供的服务保存到这个 Map 中存起来，之后方便 consumer 调用。这个类也很简单，注册服务就是放入 Map，获取服务就是从 Map 中 Get，删除服务就是从 Map 中删除。

```java [LocalRegistry.java]
package top.dhbxs.rpc.registry;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 本地服务注册器
 *
 * @author dhbxs
 * @since 2026/4/21
 */
public class LocalRegistry {

    /**
     * 存储注册信息 使用线程安全的 ConcurrentHashMap
     * Key -> 服务名称
     * Value -> 服务实现类
     */
    private static final Map<String, Class<?>> map = new ConcurrentHashMap<>();

    /**
     * 注册服务
     *
     * @param serviceName 服务名称
     * @param implClass   服务实现类
     */
    public static void register(String serviceName, Class<?> implClass) {
        map.put(serviceName, implClass);
    }

    /**
     * 获取服务
     *
     * @param serviceName 服务名称
     * @return 服务实现类
     */
    public static Class<?> get(String serviceName) {
        return map.get(serviceName);
    }

    /**
     * 删除服务
     *
     * @param serviceName 服务名称
     */
    public static void remove(String serviceName)  {
        map.remove(serviceName);
    }
}

```

##### 5）注册服务到注册中心
接下来在启动提供者服务的时候，需要将服务注册到注册中心。就是把服务名和服务实现类放到 `ConcurrentHashMap`中。修改 `EasyProviderExample`这个类，加入注册服务的代码。

```java [EasyProviderExample.java]
/**
 * 简单的服务提供者示例
 *
 * @author dhbxs
 * @since 2026/4/21
 */
public class EasyProviderExample {

    public static void main(String[] args) {
        // 注册服务
        LocalRegistry.register(UserService.class.getName(), UserServiceImpl.class);

        // 启动 web 服务
        VertxHttpServer vertxHttpServer = new VertxHttpServer();
        vertxHttpServer.doStart(8080);
    }
}
```

##### 6）实现序列化器
因为 RPC 框架都是通过网络来传输数据，消费者和服务提供者是通过网络来交互，所以需要将传输信息序列化，这样才能在网络中直接传输 Java 对象。

这里我们简单使用 JDK 序列化来实现。

先定义一个序列化和反序列化接口，方便后续如果有更先进的序列化实现可以快速替换。

```java [Serializer.java]
package top.dhbxs.rpc.serializer;

import java.io.IOException;

/**
 * 序列化器接口
 */
public interface Serializer {

    /**
     * 序列化
     *
     * @param object 要序列化的对象
     * @param <T>    序列化对象的类型
     * @return 序列化字节数组
     * @throws IOException IO异常
     */
    <T> byte[] serialize(T object) throws IOException;

    /**
     * 反序列化
     *
     * @param bytes 字节数组
     * @param type  类型
     * @param <T>   反序列化对象的类型
     * @return 该类的对象
     * @throws IOException IO异常
     */
    <T> T deserialize(byte[] bytes, Class<T> type) throws IOException;
}
```

然后基于 JDK 自带的序列化器实现 JdkSerializer

```java [JdkSerializer.java]
package top.dhbxs.rpc.serializer;

import java.io.*;

/**
 * 基于 JDK 实现序列化器
 *
 * @author dhbxs
 * @since 2026/4/21
 */
public class JdkSerializer implements Serializer {

    /**
     * 序列化
     *
     * @param object 要序列化的对象
     * @return 序列化字节数组
     * @throws IOException IO异常
     */
    @Override
    public <T> byte[] serialize(T object) throws IOException {
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();

        try (ObjectOutputStream objectOutputStream = new ObjectOutputStream(byteArrayOutputStream)) {
            objectOutputStream.writeObject(object);
            objectOutputStream.flush();
            return byteArrayOutputStream.toByteArray();
        }
    }

    /**
     * 反序列化
     *
     * @param bytes 字节数组
     * @param type  类型
     * @return 该类的对象
     * @throws IOException IO异常
     */
    @Override
    public <T> T deserialize(byte[] bytes, Class<T> type) throws IOException {
        ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(bytes);
        ObjectInputStream objectInputStream = new ObjectInputStream(byteArrayInputStream);

        try {
            return (T) objectInputStream.readObject();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(e);
        } finally {
            objectInputStream.close();
        }
    }
}

```

##### 7）封装请求体和响应体
这个就不必多说了，直接上代码。这些数据主要是为了方便使用 Java 反射机制来调用对应的方法。

```java [RpcRequest.java]
package top.dhbxs.rpc.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * RPC 调用请求封装
 *
 * @author dhbxs
 * @since 2026/4/21
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RpcRequest implements Serializable {

    /**
     * 服务名称
     */
    private String serviceName;

    /**
     * 方法名称
     */
    private String methodName;

    /**
     * 参数类型列表
     */
    private Class<?>[] parameterTypes;

    /**
     * 参数列表
     */
    private Object[] args;
}
```

```java [RpcResponse.java]
package top.dhbxs.rpc.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * RPC 调用响应封装
 *
 * @author dhbxs
 * @since 2026/4/21
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RpcResponse implements Serializable {

    /**
     * 响应数据
     */
    private Object data;

    /**
     * 响应数据类型
     */
    private Class<?> dataType;

    /**
     * 响应信息
     */
    private String message;

    /**
     * 异常信息
     */
    private Exception exception;
}

```

##### 8）请求处理器
请求处理器要做的就是接收消费者模块发起的网络请求，然后进行反序列化处理并调用对应的提供者方法实现功能，再响应序列化后的数据。

```java [HttpServerHandler.java]
package top.dhbxs.rpc.server;

import io.vertx.core.Handler;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.http.HttpServerResponse;
import top.dhbxs.rpc.model.RpcRequest;
import top.dhbxs.rpc.model.RpcResponse;
import top.dhbxs.rpc.registry.LocalRegistry;
import top.dhbxs.rpc.serializer.JdkSerializer;
import top.dhbxs.rpc.serializer.Serializer;

import java.io.IOException;
import java.lang.reflect.Method;

/**
 * HTTP 请求处理
 *
 * @author dhbxs
 * @since 2026/4/21
 */
public class HttpServerHandler implements Handler<HttpServerRequest> {

    /**
    * 请求处理器主要功能：
    * 1. 反序列化请求体，拿到请求参数
    * 2. 根据参数中的服务名称，从本地注册器中获取对应的服务实现类
    * 3. 通过反射机制调用
    * 4. 对调用结果封装和序列化，响应结果
    */
    @Override
    public void handle(HttpServerRequest request) {
        // 指定序列化器
        final Serializer serializer = new JdkSerializer();

        // 记录日志
        System.out.println("Received request: " + request.method() + " " + request.uri());

        request.bodyHandler(body -> {
            // 取出请求体中的数据
            byte[] bytes = body.getBytes();
            RpcRequest rpcRequest = null;

            // 请求数据反序列化为请求实体
            try {
                rpcRequest = serializer.deserialize(bytes, RpcRequest.class);
            } catch (Exception e) {
                e.printStackTrace();
            }
            // 构造响应结果对象
            RpcResponse rpcResponse = new RpcResponse();
            if (rpcRequest == null) {
                rpcResponse.setMessage("RpcRequest is null");
                doResponse(request, rpcResponse, serializer);
                return;
            }

            try {
                // 获取要调用服务的实现类
                Class<?> implClass = LocalRegistry.get(rpcRequest.getServiceName());
                // 反射拿到要调用的方法
                Method method = implClass.getMethod(rpcRequest.getMethodName(), rpcRequest.getParameterTypes());
                // 反射执行方法，拿到执行结果
                Object result = method.invoke(implClass.newInstance(), rpcRequest.getArgs());

                // 封装返回结果
                rpcResponse.setData(result);
                rpcResponse.setDataType(method.getReturnType());
                rpcResponse.setMessage("OK");
            } catch (Exception e) {
                e.printStackTrace();
                rpcResponse.setMessage(e.getMessage());
                rpcResponse.setException(e);
            }

            // 响应数据
            doResponse(request, rpcResponse, serializer);
        });


    }

    /**
     * 响应
     *
     * @param request     请求
     * @param rpcResponse 响应结果
     * @param serializer  序列化器
     */
    private void doResponse(HttpServerRequest request, RpcResponse rpcResponse, Serializer serializer) {
        HttpServerResponse httpServerResponse = request.response().putHeader("content-type", "application/json");

        try {
            // 序列化响应内容
            byte[] serialized = serializer.serialize(rpcResponse);
            httpServerResponse.end(Buffer.buffer(serialized));
        } catch (IOException e) {
            e.printStackTrace();
            httpServerResponse.end(Buffer.buffer());
        }
    }
}

```

然后需要在之前写的 `VertxHttpServer` 类中绑定并使用这个请求处理器

```java [VertxHttpServer.java]
package top.dhbxs.rpc.server;

import io.vertx.core.Vertx;

/**
 * 基于 Vertx 实现的 web 服务器
 *
 * @author dhbxs
 * @since 2026/4/21
 */
public class VertxHttpServer implements HttpServer {

    /**
     * 启动服务器
     *
     * @param port 端口
     */
    @Override
    public void doStart(int port) {
        // 创建 Vertx 实例
        Vertx vertx = Vertx.vertx();

        // 创建 HTTP 服务器
        io.vertx.core.http.HttpServer server = vertx.createHttpServer();

        // server.requestHandler(request -> {
        //     System.out.println("Received request: Method: " + request.method() + " URI: " + request.uri());

        //     request.response().putHeader("content-type", "text/html")
        //             .end("<h1>Hello Vert.x HTTP server!</h1>");
        // });

       server.requestHandler(new HttpServerHandler());

        server.listen(port, result -> {
            if (result.succeeded()) {
                System.out.println("Server is now listening on port " + port);
            } else {
                System.out.println("Failed to start server: " + result.cause());
            }
        });
    }
}
```

##### 9）动态代理实现跨模块调用
通过动态代理，让消费者模块调用提供者模块
关于静态代理，动态代理这块的内容，如果不是很了解，可以参考我之前写的关于动态代理的博客

::link-card
---
title: Spring AOP 动态代理机制：从静态代理到 JDK 与 CGLIB 的实现
icon: https://file.dhbxs.top/ylvwvjjs.jpg
link: https://blog.dhbxs.top/posts/370adf0
class: gradient-card active
---
::

如果理解动态代理，那么继续。编写动态代理类 ServiceProxy 实现 InvocationHandler 接口的 invoke 方法。

```java [ServiceProxy.java]
package top.dhbxs.rpc.proxy;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import top.dhbxs.rpc.model.RpcRequest;
import top.dhbxs.rpc.model.RpcResponse;
import top.dhbxs.rpc.serializer.JdkSerializer;
import top.dhbxs.rpc.serializer.Serializer;

import java.io.IOException;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

/**
 * 服务代理 (基于JDK动态代理)
 *
 * @author dhbxs
 * @since 2026/4/22
 */
public class ServiceProxy implements InvocationHandler {

    /**
     * 调用代理
     *
     * @return
     * @throws Throwable
     */
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 指定序列化器
        Serializer serializer = new JdkSerializer();

        // 构造请求
        RpcRequest rpcRequest = RpcRequest.builder()
                .serviceName(method.getDeclaringClass().getName())
                .methodName(method.getName())
                .parameterTypes(method.getParameterTypes())
                .args(args)
                .build();

        try {
            // 序列化请求
            byte[] bodyBytes = serializer.serialize(rpcRequest);

            // TODO 这里暂时用硬编码地址，真正的RPC框架都有注册中心和服务发现机制解决
            try (HttpResponse httpResponse = HttpRequest.post("http://localhost:8080").body(bodyBytes).execute()) {
                byte[] result = httpResponse.bodyBytes();

                // 反序列化
                RpcResponse rpcResponse = serializer.deserialize(result, RpcResponse.class);
                return rpcResponse.getData();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        return null;
    }
}

```

然后创建工厂类 ServiceProxyFactory，根据指定的类，创建对应的代理类。这也算是一种工厂设计模式吧。

```java [ServiceProxyFactory.java]
package top.dhbxs.rpc.proxy;

import java.lang.reflect.Proxy;

/**
 * 服务代理工厂，用来创建代理对象
 *
 * @author dhbxs
 * @since 2026/4/22
 */
public class ServiceProxyFactory {

    public static <T> T getProxy(Class<T> serviceClass) {
        return (T) Proxy.newProxyInstance(serviceClass.getClassLoader(), new Class[]{serviceClass}, new ServiceProxy());
    }
}

```

有了工厂类统一创建代理类之后，修改 `EasyConsumerExample` 中 `UserService userService`对象的获取方式。

```java [EasyConsumerExample.java]
package top.dhbxs.rpc.consumer;

import top.dhbxs.rpc.common.model.User;
import top.dhbxs.rpc.common.service.UserService;
import top.dhbxs.rpc.proxy.ServiceProxyFactory;

/**
 * 简单的服务消费者示例
 *
 * @author dhbxs
 * @since 2026/4/21
 */
public class EasyConsumerExample {

    public static void main(String[] args) {
        UserService userService = ServiceProxyFactory.getProxy(UserService.class);

        User user = new User();
        user.setName("灯火不休时");

        // 如果没有 RPC 框架，这里调用会报 NPE，因为userService为空，不是实体对象，调用不了方法
        // 当前项目 pom 中，并没有引入 UserService 的实现 UserServiceImpl
        // UserServiceImpl 为服务提供者 provider 模块下的类，当前项目的 pom 也没有直接引入 provider 模块
        // 所以需要 RPC 框架帮我们完成调用
        User newUser = userService.getUser(user);

        if (newUser != null) {
            System.out.println(newUser.getName());
        } else {
            System.out.println("user = null");
        }
    }
}

```

至此开发完毕，可以 Debug 下有没有错误，然后接下来运行代码。

## 测试运行
1.首先需要启动服务提供者，让他先在本地注册服务。以 Debug 模式启动 provider 模块中 `EasyProviderExample`中的 main 方法。不出意外应该会看到如下控制台信息

::pic
---
src: https://file.dhbxs.top/blog_img/1777703216956_image.webp
caption: 控制台信息截图
---
::

2.接下来启动服务消费者 consumer 模块，以 debug 模式启动 consumer 模块中 `EasyConsumerExample` 里的 main 方法。

不出意外的话会看到如下信息

::pic
---
src: https://file.dhbxs.top/blog_img/1777703256728_image.webp
caption: 控制台信息截图
---
::

## 回顾整个流程
我们运行时，启动了两个 main 方法。

首先启动提供者 provider 中的 main 方法，这个方法启动后会做几件事：

1. 调用 easy-rpc 模块中的注册服务方法 `LocalRegistry.register`，首先在 rpc 框架的 `ConcurrentHashMap` 中保存了提供者提供的服务。这个服务是 provider 模块中对 common 模块定义的 UserService 接口做了实现，提供了实现类 `UserServiceImpl`。
2. 启动 easy-rpc 模块中写好的 HTTP 服务程序，监听 8080 端口。

然后我们启动消费者 consumer 中的 main 方法，这个方法启动后会做几件事：

1. 调用 easy-rpc 模块中的工厂方法，创建出 UserService 接口的实现类。主要是通过动态代理来创建出一个代理对象，但是这个代理对象本质上和目标对象已经基本没关系了，因为代理对象并没有直接通过反射调用 method.invok 方法来执行目标对象的目标方法，而仅仅是发送网络请求。
2. 然后代码中 new 了一个 User 对象，并且给它设置名称
3. 接下来通过 userService 这个代理对象，来获取 user。此时因为我们调用了代理对象的代理方法，所以动态代理中的 InvocationHandler 里的 invoke 方法会被执行，这个方法底层执行了很多代码，主要就是代替我们创建请求，序列化请求体，发送请求到我们 easy-rpc 模块中启动的 HTTP 服务器，然后 easy-rpc 模块中的请求处理器就开始接收到请求，反序列化请求体，获取请求参数，利用反射，调用 provider 模块中提供的 UserServiceImpl 类里的 getUser() 方法，并拿到返回值，然后再构造响应体，序列化响应体，然后发送序列化后的响应数据给 consumer 消费者模块
4. 打印通过 RPC 框架获取道德 newUser 对象中的名字
