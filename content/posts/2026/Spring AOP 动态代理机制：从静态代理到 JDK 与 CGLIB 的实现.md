---
title: Spring AOP 动态代理机制：从静态代理到 JDK 与 CGLIB 的实现
description: 用日志和业务逻辑解耦的案例，从静态代理的手动编码痛点出发，逐步演进至JDK动态代理与CGLIB字节码增强，对比两种机制的底层实现差异与适用场景，深入理解Spring AOP底层的实现方式。
date: 2026-04-20 11:18:07
updated: 2026-04-20 11:18:07
image: https://file.dhbxs.top/blog_img/1776615019347_dtdl.webp
permalink: /posts/370adf0
categories: [技术]
tags: [Spring, Java]
recommend: 5
---

Spring提供了对面向切面编程(AOP)的丰富支持，允许通过分离应用的业务逻辑与系统级服务（例如审计（auditing）和事务（transaction）管理）进行内聚性的开发。应用对象只实现它们应该做的——完成业务逻辑——仅此而已。它们并不负责（甚至是意识）其它的系统级关注点，例如日志或事务支持。

Spring 的 AOP 是通过动态代理来实现的。代理是一种设计模式，但是这里说到的静态代理和动态代理不是GoF23种设计模式分类中的一种，而是 Java 领域中按代理类生成时机来划分的实现方式，属于代理模式的具体技术实践，而非 GoF 定义的新分类。

A (调用方) -> C(代理) -> B(目标)

调用方不直接调用使用 B，而是通过代理来间接使用 B，这就是代理。

## 静态代理
### 耦合日志的代码
假设我们要实现一个非常简单的登陆功能，用户名是 admin，密码是 123456

代码如下

1.首先定义 LoginService 接口

```java [LoginService.java]
package top.dhbxs.demo.springaop.staticproxy.service;

/**
 * @author dhbxs
 * @since 2026/4/19
 */
public interface LoginService {

    boolean login(String username, String password);
}
```

2.实现接口

```java [LoginServiceImpl.java]
package top.dhbxs.demo.springaop.staticproxy.service.impl;

import lombok.extern.slf4j.Slf4j;
import top.dhbxs.demo.springaop.staticproxy.service.LoginService;

/**
 * @author dhbxs
 * @since 2026/4/19
 */
@Slf4j
public class LoginServiceImpl implements LoginService {

    @Override
    public boolean login(String username, String password) {
        log.info("开始登陆"); // 日志：非核心业务代码
        log.info("{} 正在登陆系统", username); // 日志：非核心业务代码
        boolean flag = "admin".equals(username) && "123456".equals(password); // 核心业务代码
        if (!flag) {
            log.error("{} 登陆失败", username); // 日志：非核心业务代码
        } else {
            log.info("{} 登陆成功", username); // 日志：非核心业务代码
        }
        return flag;
    }
}
```

3.编写测试类测试功能

```java [LoginServiceTest.java]
package top.dhbxs.demo.springaop.staticproxy.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import top.dhbxs.demo.springaop.staticproxy.service.impl.LoginServiceImpl;

@SpringBootTest
class LoginServiceTest {

    @Test
    void login() {
        LoginService loginService = new LoginServiceImpl();

        boolean flag = loginService.login("admin", "123456");
        System.out.println("flag = " + flag);
    }
}
```

4.输出如下

```java [console.log]
2026-04-19T22:17:05.145+08:00  INFO 28308 --- [SpringAOP] [           main] t.d.d.s.s.service.impl.LoginServiceImpl  : 开始登陆
2026-04-19T22:17:05.145+08:00  INFO 28308 --- [SpringAOP] [           main] t.d.d.s.s.service.impl.LoginServiceImpl  : admin 正在登陆系统
2026-04-19T22:17:05.146+08:00  INFO 28308 --- [SpringAOP] [           main] t.d.d.s.s.service.impl.LoginServiceImpl  : admin 登陆成功
flag = true
```

以上就是非常简单直接的一个登陆逻辑，可以在 LoginServiceImpl 代码中看到有很多非业务相关的日志记录的代码，和业务逻辑是深度耦合的。



接下来使用代理模式中的静态代理来优化解耦。

### 静态代理解耦
1.创建一个代理类，实现相同的 LoginService 接口

```java [LoginServiceProxy.java]
package top.dhbxs.demo.springaop.staticproxy.service.proxy;

import lombok.extern.slf4j.Slf4j;
import top.dhbxs.demo.springaop.staticproxy.service.LoginService;
import top.dhbxs.demo.springaop.staticproxy.service.impl.LoginServiceImpl;

/**
 * 静态代理：解决代码耦合
 * 代理类和目标类都实现了同一个接口
 *
 * @author dhbxs
 * @since 2026/4/19
 */
@Slf4j
public class LoginServiceProxy implements LoginService {


    /**
     * 代理方法，帮你调用目标
     *
     * @param username 用户名
     * @param password 密码
     * @return 登陆结果
     */
    @Override
    public boolean login(String username, String password) {


        log.info("开始登陆"); // 日志：非核心业务代码
        log.info("{} 正在登陆系统", username); // 日志：非核心业务代码

        LoginService loginService = new LoginServiceImpl(); // 创建目标对象
        boolean flag = loginService.login(username, password); // 调用目标方法

        if (!flag) {
            log.error("{} 登陆失败", username); // 日志：非核心业务代码
        } else {
            log.info("{} 登陆成功", username); // 日志：非核心业务代码
        }

        return flag;
    }
}
```

2.修改原来的 LoginServiceImpl 接口

```java [LoginServiceImpl.java]
package top.dhbxs.demo.springaop.staticproxy.service.impl;

import lombok.extern.slf4j.Slf4j;
import top.dhbxs.demo.springaop.staticproxy.service.LoginService;

/**
 * @author dhbxs
 * @since 2026/4/19
 */
@Slf4j
public class LoginServiceImpl implements LoginService {

    @Override
    public boolean login(String username, String password) {

        boolean flag = "admin".equals(username) && "123456".equals(password); // 核心业务代码

        return flag;
    }
}
```

3.修改测试类，调用代理类实现业务

```java [LoginServiceTest.java]
package top.dhbxs.demo.springaop.staticproxy.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import top.dhbxs.demo.springaop.staticproxy.service.proxy.LoginServiceProxy;

@SpringBootTest
class LoginServiceTest {

    @Test
    void login() {
        LoginService loginService = new LoginServiceProxy(); // 创建代理对象

        boolean flag = loginService.login("admin", "123456"); // 调用代理对象方法
        System.out.println("flag = " + flag);
    }
}
```

修改后，我们通过 LoginServiceProxy 实现相同的 LoginService 接口，然后调用方直接调用我们的 Proxy 代理对象，由代理对象通义打印日志，并由代理对象调用最终目标方法，实现日志功能和业务逻辑解耦合。

但是这种静态代理需要我们一个个手动创建代理类，调用代理对象，还是太麻烦。所以就有了动态代理。

## 动态代理
+ JDK 动态代理
    - 基于接口实现，代理类和目标类都实现同一个接口。代理类是基于反射机制生成。类名一般是 $Proxy 前缀开头 + 数字
    - 核心 API：`java.lang.reflect` 包下的 `Proxy`{lang='java'}（生成代理对象）、`InvocationHandler`{lang='java'}（定义增强逻辑）
    - 调用逻辑：A -> C(代理对象 -> h( InvocationHandler.invoke() )) -> B(目标)
+ CGLIB 动态代理
    - 基于继承实现，代理类是目标类的子类。代理类是通过第三方插件，字节码生成工具动态生成的内部类。
    - 无需接口：直接继承目标类生成代理，目标类可以无任何接口
    - 核心 API：`Enhancer`{lang='java'}（生成代理对象）、`MethodInterceptor`{lang='java'}（ 定义增强逻辑）

### JDK 动态代理
新建一个 jdkproxy.service 包，把之前的 LoginService 接口和 LoginServiceImpl 实现类复制到新包下

然后新建测试类

```java [LoginServiceTest.java]
package top.dhbxs.demo.springaop.jdkproxy.service;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import top.dhbxs.demo.springaop.jdkproxy.service.impl.LoginServiceImpl;

import java.lang.reflect.Proxy;

@Slf4j
@SpringBootTest
class LoginServiceTest {

    @Test
    void login() {
        // 创建目标对象
        LoginService loginService = new LoginServiceImpl();

        // 创建代理对象
        LoginService loginServiceProxy = (LoginService) Proxy.newProxyInstance(
                loginService.getClass().getClassLoader(), // 目标类的类加载器
                loginService.getClass().getInterfaces(), // 目标对象的接口。代理类和目标类实现同一个接口
                (proxy, method, args) -> { // InvocationHandler 对象 隐式函数式接口
                    log.info("开始登陆"); // 日志：非核心业务代码
                    log.info("{} 正在登陆系统", args[0]); // 日志：非核心业务代码

                    boolean flag = (boolean) method.invoke(loginService, args); // 调用目标方法

                    if (!flag) {
                        log.error("{} 登陆失败", args[0]); // 日志：非核心业务代码
                    } else {
                        log.info("{} 登陆成功", args[0]); // 日志：非核心业务代码
                    }

                    return flag;
                });


        // 调用代理对象
        boolean flag = loginServiceProxy.login("admin", "123456");
        System.out.println("flag = " + flag);
    }
}
```

### CGLIB 动态代理
1.引入 CGLIB 依赖

```xml [pom.xml]
<dependency>
    <groupId>cglib</groupId>
    <artifactId>cglib</artifactId>
    <version>3.3.0</version>
</dependency>
```

2.新建测试类

```java [LoginServiceTest.java]
package top.dhbxs.demo.springaop.cglibproxy.service;

import lombok.extern.slf4j.Slf4j;
import net.sf.cglib.proxy.Enhancer;
import net.sf.cglib.proxy.MethodInterceptor;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Slf4j
@SpringBootTest
class LoginServiceTest {

    @Test
    void login() {
        // 创建目标对象
        LoginService loginService = new LoginService();

        // 创建代理对象
        LoginService loginServiceProxy = (LoginService) Enhancer.create(
            LoginService.class,
            (MethodInterceptor) (proxyObj, method, argsArr, methodProxy) -> {
                log.info("开始登陆"); // 日志：非核心业务代码
                log.info("{} 正在登陆系统", argsArr[0]); // 日志：非核心业务代码
                boolean flag = (boolean) method.invoke(loginService, argsArr); // 调用目标对象方法
                if (!flag) {
                    log.error("{} 登陆失败", argsArr[0]); // 日志：非核心业务代码
                } else {
                    log.info("{} 登陆成功", argsArr[0]); // 日志：非核心业务代码
                }
                return flag;
            });

        // 调用代理对象
        boolean flag = loginServiceProxy.login("admin", "123456");
        System.out.println("flag = " + flag);
    }
}
```

3.添加 jvm 参数 `--add-opens java.base/java.lang=ALL-UNNAMED`，因为 JDK9 开始为了增强安全性，引入了模块系统（JPMS）对反射做了严格限制。CGLIB 尝试通过反射调用 ClassLoader.defineClass() 方法来动态生成类，但该方法属于 java.lang 包且未被暴露给“未命名模块”（即你的普通 Java 项目）。所以在不加上面的 jvm 参数时会报如下错误：

```java [console.log]
Unable to make protected final java.lang.Class java.lang.ClassLoader.defineClass(...) accessible:
module java.base does not "opens java.lang" to unnamed module
```

4.执行结果

```java [console.log]
2026-04-19T23:36:10.364+08:00  INFO 15380 --- [SpringAOP] [           main] t.d.d.s.c.service.LoginServiceTest       : 开始登陆
2026-04-19T23:36:10.365+08:00  INFO 15380 --- [SpringAOP] [           main] t.d.d.s.c.service.LoginServiceTest       : admin 正在登陆系统
2026-04-19T23:36:10.367+08:00  INFO 15380 --- [SpringAOP] [           main] t.d.d.s.c.service.LoginServiceTest       : admin 登陆成功
flag = true
```

## 总结
| 特性 | JDK 动态代理 | CGLIB 动态代理 |
| --- | --- | --- |
| 依赖条件 | 目标类必须实现接口 | 目标类无需实现接口 |
| 实现方式 | 实现与目标类相同的接口 | 继承目标类 |
| 核心 API | Proxy + InvocationHandler | Enhancer + MethodInterceptor |
| Spring AOP 适配 | 目标类有接口时默认使用 | 目标类无接口时自动切换使用 |
