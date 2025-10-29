# DateTimePickerPro

#### 介绍

element-ui [DatePicker](https://element.eleme.cn/#/zh-CN/component/date-picker)和 [DateTimePicker](https://element.eleme.cn/#/zh-CN/component/datetime-picker) 二次封装。基于原组件进行一些扩展，原组件的所有属性、方法、插槽可继续按原方式使用。<br/>
当前组件<span style="color: #3EAF7C;font-weight: 500;">DateTimePickerPro</span>拓展新增了两个属性`custom-minute-step`和`custom-second-step`进行分钟数和秒钟数自定义步距。

>**注意**：当前组件内部有引用element-ui进行拓展，引用该组件时，项目需要安装并引入element-ui

#### 组件安装

npm 或者 yarn 安装 `date-time-picker-pro`

```bash
npm install date-time-picker-pro -S
```
or
```bash
yarn add date-time-picker-pro -S
```

#### 引入组件

```js
import Vue from 'vue'

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

import DateTimePickerPro from 'date-time-picker-pro'

Vue.use(ElementUI)
Vue.use(DateTimePickerPro)
```

#### 使用组件

```html
<template>
  <!-- 单个日期时间 -->
  <date-time-picker-pro
    v-model="singleDateTime"
    type="datetime"
    placeholder="选择日期时间"
    default-time="06:00:00"
    :custom-minute-step="20"
    :custom-second-step="10"
    value-format="yyyy/MM/dd HH:mm:ss"
    format="yyyy/MM/dd HH:mm:ss"
  ></date-time-picker-pro>
  <!-- 日期时间范围 -->
  <date-time-picker-pro
    v-model="multipleDateTime"
    type="datetimerange"
    :default-time="['09:00:00', '19:00:00']"
    :custom-minute-step="30"
    :custom-second-step="15"
    range-separator="至"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    value-format="yyyy/MM/dd HH:mm:ss"
    format="yyyy/MM/dd HH:mm:ss"
  ></date-time-picker-pro>
</template>

<script>
  export default {
    data() {
      return {
        singleDateTime: '',
        multipleDateTime: [],
      };
    }
  }
</script>

```

### Attribute

| 参数          | 说明                                                     | 类型    | 可选值 | 默认值 |
| ------------- | ------------------------------------------------------- | ------- | ------ | ----- |
| custom-minute-step    | 分钟数自定义步距，若大于`59`，则只显示`0`           | string、number  | 自然数     | 1     |
| custom-second-step    | 秒钟数自定义步距，若大于`59`，则只显示`0`           | string、number  | 自然数      | 1     |

>其他选项可以参照element-ui [DatePicker](https://element.eleme.cn/#/zh-CN/component/date-picker)和 [DateTimePicker](https://element.eleme.cn/#/zh-CN/component/datetime-picker)