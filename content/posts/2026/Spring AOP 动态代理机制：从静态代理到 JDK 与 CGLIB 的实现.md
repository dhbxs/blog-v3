---
title: Spring AOP 动态代理机制：从静态代理到 JDK 与 CGLIB 的实现
description: 用日志和业务逻辑解耦的案例，从静态代理的手动编码痛点出发，逐步演进至JDK动态代理与CGLIB字节码增强，对比两种机制的底层实现差异与适用场景，深入理解Spring AOP底层的实现方式。
date: 2026-04-20 11:18:07
updated: 2026-04-23 22:43:00
image: https://file.dhbxs.top/blog_img/1776615019347_dtdl.webp
permalink: /posts/370adf0
categories: [技术]
tags: [Spring, Java]
recommend: 5
---

Spring提供了对面向切面编程(AOP)的丰富支持，允许通过分离应用的业务逻辑与系统级服务（例如审计（auditing）和事务（transaction）管理）进行内聚性的开发。应用对象只实现它们应该做的——完成业务逻辑——仅此而已。它们并不负责（甚至是意识）其它的系统级关注点，例如日志或事务支持。

Spring 的 AOP 是通过动态代理来实现的。代理是一种设计模式，但是这里说到的静态代理和动态代理不是GoF23种设计模式分类中的一种，而是 Java 领域中按代理类生成时机来划分的实现方式，属于代理模式的具体技术实践，而非 GoF 定义的分类。

## 代理模式
A (调用方) -> C(代理) -> B(目标)

调用方不直接调用使用 B，而是通过代理 C 来间接使用 B，这就是代理。

### 代理模式的作用
1. 解决程序中 A 对象和 B 对象无法直接交互的问题

举例：类似婚介所，男方和女方互不相识，通过中介（代理）相互认识

2. 给程序中某块代码做功能增强或解耦

举例：还是婚介所，男方自己找的对象自己不满意，分手后，通过婚介(代理对象)寻找，找到原对象的增强版，各方面更为满意

3. 给程序中某块代码提供保护

举例：依然是婚介所，男方本来是登报征婚，结果手机被骚扰电话打爆，出于保护的目的，选择了婚介所（代理），让婚介所把关，有合适的再联系。



上面的男方就是目标对象，婚介所就是代理对象，代理对象代替目标征婚，这就是代理。

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

```log [console.log]
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
    - 核心 API：`package java.lang.reflect`{lang="java"} 下的 `class Proxy`{lang="java"}（生成代理对象）、`InvocationHandler`{lang="java"}（定义增强逻辑）
    - 调用逻辑：A -> C(代理对象 -> h( InvocationHandler.invoke() )) -> B(目标)
+ CGLIB 动态代理
    - 基于继承实现，代理类是目标类的子类。代理类是通过第三方插件，字节码生成工具动态生成的内部类。
    - 无需接口：直接继承目标类生成代理，目标类可以无任何接口
    - 核心 API：`Enhancer`{lang="java"}（生成代理对象）、`MethodInterceptor`{lang="java"}（ 定义增强逻辑）

### JDK 动态代理
新建一个 jdkproxy.service 包，把之前的 LoginService 接口和 LoginServiceImpl 实现类复制到新包下

然后新建测试类，源码如下

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
        // 代理对象和目标对象都实现了同一个接口，所以这个方法默认返回的 Object 对象可以强制向下转型为LoginService
        LoginService loginServiceProxy = (LoginService) Proxy.newProxyInstance(
                loginService.getClass().getClassLoader(), // 类加载器，需要提供一个类加载器，让动态生成的字节码能加载到内存中
                loginService.getClass().getInterfaces(), // 代理类要实现哪个接口，或者哪些接口
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

#### 创建步骤
使用 JDK 给一个目标对象动态创建代理对象，分为三步

##### 1. 先创建目标对象
`LoginService loginService = new LoginServiceImpl();`{lang="java"} 我们要给 `loginServiceImpl` 这个类（目标类）做功能增强，先 new 这个类的实体对象。然后将实体类类型改为 `LoginService` 这个接口，这里就是面向对象里的多态了。因为 JDK 动态代理是基于接口实现的，所以目标类需要实现一个接口，也就是 LoginService 接口，后续的代理类也会实现这个接口。

##### 2. 创建代理对象
JDK 动态代理主要使用 `package java.lang.reflect`{lang="java"} 下的 `class Proxy`{lang="java"} 中的 `newProxyInstance()`{lang="java"}（翻译为 新建代理实例，也就是新建代理对象） 方法来生成代理对象。



本质上，`Proxy.newProxyInstance()`{lang="java"} 这个方法做了两件事：

+ 在内存中动态的生成了一个类的字节码 class
+ new 了一个对象。通过内存中生成的代理类的字节码，实例化了代理对象



这个 newProxyInstance(类加载器，代理类实现哪些接口，调用处理器) 需要传入三个参数



1. 第一个参数：ClassLoader loader

告诉 JDK，要用哪个类加载器加载动态生成的代理类的字节码，一般我们就用目标对象所属类的类加载器，这里就是 `loginService.getClass().getClassLoader()`{lang="java"}。

在 Spring 中，使用哪个类的类加载器由一个静态方法来确定，在 Spring-Core 中的 `package org.springframework.util`{lang="java"}包下的 `public abstract class ClassUtils`{lang="java"} 这个抽象类里，有一个静态方法 `getDefaultClassLoader()`{lang="java"}

源码如下：

```java [org.springframework.util.ClassUtils.java]
/**
 * Return the default ClassLoader to use: typically the thread context
 * ClassLoader, if available; the ClassLoader that loaded the ClassUtils
 * class will be used as fallback.
 * <p>Call this method if you intend to use the thread context ClassLoader
 * in a scenario where you clearly prefer a non-null ClassLoader reference:
 * for example, for class path resource loading (but not necessarily for
 * {@code Class.forName}, which accepts a {@code null} ClassLoader
 * reference as well).
 * @return the default ClassLoader (only {@code null} if even the system
 * ClassLoader isn't accessible)
 * @see Thread#getContextClassLoader()
 * @see ClassLoader#getSystemClassLoader()
 */
@Nullable
public static ClassLoader getDefaultClassLoader() {
    ClassLoader cl = null;
    try {
        cl = Thread.currentThread().getContextClassLoader();
    }
    catch (Throwable ex) {
        // Cannot access thread context ClassLoader - falling back...
    }
    if (cl == null) {
        // No thread context class loader -> use class loader of this class.
        cl = ClassUtils.class.getClassLoader();
        if (cl == null) {
            // getClassLoader() returning null indicates the bootstrap ClassLoader
            try {
                cl = ClassLoader.getSystemClassLoader();
            }
            catch (Throwable ex) {
                // Cannot access system ClassLoader - oh well, maybe the caller can live with null...
            }
        }
    }
    return cl;
}
```

Spring 采用的是三级降级策略，优先使用当前线程上下文类加载器 ThreadContextClassLoader（TCCL），如果失败，降级使用 Spring 自己的类加载器，如果还是白，继续降级，使用兜底方案，使用系统类加载器，如果依然失败，则返回 null交给调用者自己解决（oh well, maybe the caller can live with null...）。



2. 第二个参数：Class<?>[] interfaces

代理类需要实现的一些接口。在 JDK 动态生成代理对象的时候，需要我们告诉他这个代理类要实现哪些接口。

类似前文中静态代理的的实现，代理类需要和目标类实现相同的接口，才能让调用者在调用的时候不需要关注具体调用的是哪个，从而做到无感，低耦合。如果代理类没有实现目标类的接口，那不就意味着代理类的行为和目标类完全不同，那就不是代理了，完全是个新类了。

上文代码中，使用 `loginService.getClass().getInterfaces()`{lang="java"}，loginService 是目标对象，调用 `getClass()`{lang="java"} 获取到的是目标对象的类，运行时是 `LoginServiceImpl.class`{lang="java"} 这个实现类，然后继续调用他的 `getInterfaces()`{lang="java"}获取到的是这个类实现的接口，就是 `LoginService.class`{lang="java"} 接口。

`getInterfaces()`{lang="java"} 返回的是数组，一个类可以多实现（implement），但是只能单继承（extend）。所以这个类实现的接口可能有多个，就需要一个数组，放到数组里传给 JDK。



3. 第三个参数：InvocationHandler h

调用处理器，JDK 帮我们动态生成了代理类，并且这个代理类实现了我们指定的接口，此时 JDK 还不知道生成的这个代理类要做什么事，也就是接口中的方法需要我们来实现，就在这个参数里实现。

这个参数是个接口，这个接口上并没有加 `@FunctionalInterface`{lang="java"} 注解，但是该接口中只有一个抽象方法 `invoke()`{lang="java"}，另外一个是静态方法 `invokeDefault()`{lang="java"} 所以是个隐式的函数式接口，可以使用 Lambda 表达式。

我们需要实现这个 `invoke()`{lang="java"} 方法，在这个方法里，写我们需要增强目标对象的目标方法的逻辑。这个方法在代理对象调用代理方法的时候，会被 JDK 调用执行。

这个方法有三个参数 `(Object proxy, Method method, Object[] args)` ，proxy 就是 JDK 动态代理生成的代理对象的引用，method 是目标对象中的目标方法（要执行的目标方法就是它），args 是目标方法上的实参。

要调用目标对象的目标方法，就需要使用反射机制，传入的参数有 method（目标方法），所以可以使用方法的 `invoke()`{lang="java"} 函数来调用目标方法。

上面代码中 `boolean flag = (boolean) method.invoke(loginService, args)`{lang="java"} 就是在调用目标对象的目标方法。这个 `invoke()`{lang="java"} 需要传入两个参数，第一个是目标对象，第二个是调用这个目标对象的目标方法时传入什么参数。

##### 3. 调用代理对象的代理方法
通过 `Proxy.newProxyInstance()`{lang="java"} 构建好代理对象后，就可以直接调用代理对象的代理方法，和调用目标对象的目标方法一样，只不过把实例对象换成了代理对象，仅此而已。

在上面示例代码中就是`loginServiceProxy.login("admin", "123456")`{lang="java"}

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

```log [console.log]
Unable to make protected final java.lang.Class java.lang.ClassLoader.defineClass(...) accessible:
module java.base does not "opens java.lang" to unnamed module
```

4.执行结果

```log [console.log]
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
