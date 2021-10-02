<template>
  <div class="el-time-spinner" :class="{ 'has-seconds': showSeconds }">
    <template v-if="!arrowControl">
      <el-scrollbar
        @mouseenter.native="emitSelectRange('hours')"
        @mousemove.native="adjustCurrentSpinner('hours')"
        class="el-time-spinner__wrapper"
        wrap-style="max-height: inherit;"
        view-class="el-time-spinner__list"
        noresize
        tag="ul"
        ref="hours">
        <li
          @click="handleClick('hours', { value: hour, disabled: disabled })"
          v-for="(disabled, hour) in hoursList"
          class="el-time-spinner__item"
          :key="hour"
          :class="{ 'active': hour === hours, 'disabled': disabled }">{{ ('0' + (amPmMode ? (hour % 12 || 12) : hour )).slice(-2) }}{{ amPm(hour) }}</li>
      </el-scrollbar>
      <el-scrollbar
        @mouseenter.native="emitSelectRange('minutes')"
        @mousemove.native="adjustCurrentSpinner('minutes')"
        class="el-time-spinner__wrapper"
        wrap-style="max-height: inherit;"
        view-class="el-time-spinner__list"
        noresize
        tag="ul"
        ref="minutes">
        <li
          @click="handleClick('minutes', { value: minItem.num, disabled: false })"
          v-for="(minItem) in minutesList"
          :key="minItem.num"
          class="el-time-spinner__item"
          :class="{ 'active': minItem.num === minutes, disabled: !minItem.enabled }">{{ ('0' + minItem.num).slice(-2) }}</li>
      </el-scrollbar>
      <el-scrollbar
        v-show="showSeconds"
        @mouseenter.native="emitSelectRange('seconds')"
        @mousemove.native="adjustCurrentSpinner('seconds')"
        class="el-time-spinner__wrapper"
        wrap-style="max-height: inherit;"
        view-class="el-time-spinner__list"
        noresize
        tag="ul"
        ref="seconds">
        <li
          @click="handleClick('seconds', { value: secondItem.num, disabled: false })"
          v-for="(secondItem) in secondsList"
          class="el-time-spinner__item"
          :class="{ 'active': secondItem.num === seconds, disabled: !secondItem.enabled }"
          :key="secondItem.num">{{ ('0' + secondItem.num).slice(-2) }}</li>
      </el-scrollbar>
    </template>
    <template v-if="arrowControl">
      <div
        @mouseenter="emitSelectRange('hours')"
        class="el-time-spinner__wrapper is-arrow">
        <i v-repeat-click="decrease" class="el-time-spinner__arrow el-icon-arrow-up"></i>
        <i v-repeat-click="increase" class="el-time-spinner__arrow el-icon-arrow-down"></i>
        <ul class="el-time-spinner__list" ref="hours">
          <li
            class="el-time-spinner__item"
            :class="{ 'active': hour === hours, 'disabled': hoursList[hour] }"
            v-for="(hour, key) in arrowHourList"
            :key="key">{{ hour === undefined ? '' : ('0' + (amPmMode ? (hour % 12 || 12) : hour )).slice(-2) + amPm(hour) }}</li>
        </ul>
      </div>
      <div
        @mouseenter="emitSelectRange('minutes')"
        class="el-time-spinner__wrapper is-arrow">
        <i v-repeat-click="decrease" class="el-time-spinner__arrow el-icon-arrow-up"></i>
        <i v-repeat-click="increase" class="el-time-spinner__arrow el-icon-arrow-down"></i>
        <ul class="el-time-spinner__list" ref="minutes">
          <li
            class="el-time-spinner__item"
            :class="{ 'active': minute === minutes }"
            v-for="(minute, key) in arrowMinuteList"
            :key="key">
            {{ minute === undefined ? '' : ('0' + minute).slice(-2) }}
          </li>
        </ul>
      </div>
      <div
        @mouseenter="emitSelectRange('seconds')"
        class="el-time-spinner__wrapper is-arrow"
        v-if="showSeconds">
        <i v-repeat-click="decrease" class="el-time-spinner__arrow el-icon-arrow-up"></i>
        <i v-repeat-click="increase" class="el-time-spinner__arrow el-icon-arrow-down"></i>
        <ul class="el-time-spinner__list" ref="seconds">
          <li
            v-for="(second, key) in arrowSecondList"
            class="el-time-spinner__item"
            :class="{ 'active': second === seconds }"
            :key="key">
            {{ second === undefined ? '' : ('0' + second).slice(-2) }}
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script type="text/babel">
  import { getRangeHours, getRangeMinutes, modifyTime } from '../../utils/date-util';
  import RepeatClick from '../../directives/repeat-click';

  export default {
    directives: {
      repeatClick: RepeatClick
    },

    props: {
      date: {},
      defaultValue: {}, // reserved for future use
      showSeconds: {
        type: Boolean,
        default: true
      },
      arrowControl: Boolean,
      amPmMode: {
        type: String,
        default: '' // 'a': am/pm; 'A': AM/PM
      },
      customMinuteStep: { // Ducr：分钟数自定义步距，若大于59，则只显示0
        type: [String, Number],
        default: 30
      },
      customSecondStep: { // Ducr：秒钟数自定义步距，若大于59，则只显示0
        type: [String, Number],
        default: 1
      },
    },

    computed: {
      hours() {
        return this.date.getHours();
      },
      minutes() {
        return this.queryApproximate(this.date.getMinutes(), this.minutesList) || 0;
      },
      seconds() {
        return this.queryApproximate(this.date.getSeconds(), this.secondsList) || 0;
      },
      hoursList() {
        return getRangeHours(this.selectableRange);
      },
      minutesList() {
        // Ducr：根据步距customMinuteStep获取最后展示面板中的分钟数值
        const list = getRangeMinutes(this.selectableRange, this.hours);
        return this.generateRange(list, this.customMinuteStep);
      },
      secondsList() {
        // Ducr：根据步距customSecondStep获取最后展示面板中的分钟数值
        let enabled = true; // 默认都可以选择秒钟
        const currMinItem = this.minutesList.find(item => item.num === this.minutes);
        // 查询到当前分钟是否为禁选，与分钟禁选状态保持一致
        if (currMinItem) {
          enabled = !!currMinItem.enabled;
        }
        const list = new Array(60).fill(enabled);
        return this.generateRange(list, this.customSecondStep);
      },
      arrowHourList() {
        const hours = this.hours;
        return [
          hours > 0 ? hours - 1 : undefined,
          hours,
          hours < 23 ? hours + 1 : undefined
        ];
      },
      arrowMinuteList() {
        const minutes = this.minutes;
        if (+this.customMinuteStep !== 1) {
          const currMinute = this.queryApproximate(minutes, this.minutesList) || 0;
          const idx = this.minutesList.findIndex(item => item.num === currMinute) || 0;
          const prevMinute = (this.minutesList[idx - 1] || {}).num;
          const nextMinute = (this.minutesList[idx + 1] || {}).num;
          return [
            prevMinute || prevMinute === 0 ? prevMinute : undefined,
            currMinute,
            nextMinute ? nextMinute : undefined
          ];
        } else {
          return [
            minutes > 0 ? minutes - 1 : undefined,
            minutes,
            minutes < 59 ? minutes + 1 : undefined
          ];
        }
      },
      arrowSecondList() {
        const seconds = this.seconds;
        if (+this.customSecondStep !== 1) {
          const currSecond = this.queryApproximate(seconds, this.secondsList) || 0;
          const idx = this.secondsList.findIndex(item => item.num === currSecond) || 0;
          const prevSecond = (this.secondsList[idx - 1] || {}).num;
          const nextSecond = (this.secondsList[idx + 1] || {}).num;
          return [
            prevSecond || prevSecond === 0  ? prevSecond : undefined,
            currSecond,
            nextSecond ? nextSecond : undefined
          ];
        } else {
          return [
            seconds > 0 ? seconds - 1 : undefined,
            seconds,
            seconds < 59 ? seconds + 1 : undefined
          ];
        }
      }
    },

    data() {
      return {
        selectableRange: [],
        currentScrollbar: null,
      };
    },

    mounted() {
      this.$nextTick(() => {
        !this.arrowControl && this.bindScrollEvent();
      });
    },

    methods: {
      increase() {
        this.scrollDown(1);
      },

      decrease() {
        this.scrollDown(-1);
      },

      modifyDateField(type, value) {
        switch (type) {
          case 'hours': this.$emit('change', modifyTime(this.date, value, this.minutes, this.seconds)); break;
          case 'minutes': this.$emit('change', modifyTime(this.date, this.hours, value, this.seconds)); break;
          case 'seconds': this.$emit('change', modifyTime(this.date, this.hours, this.minutes, value)); break;
        }
      },

      handleClick(type, {value, disabled}) {
        if (!disabled) {
          this.modifyDateField(type, value);
          this.emitSelectRange(type);
          this.adjustSpinner(type, value);
        }
      },

      emitSelectRange(type) {
        if (type === 'hours') {
          this.$emit('select-range', 0, 2);
        } else if (type === 'minutes') {
          this.$emit('select-range', 3, 5);
        } else if (type === 'seconds') {
          this.$emit('select-range', 6, 8);
        }
        this.currentScrollbar = type;
      },

      bindScrollEvent() {
        const bindFuntion = (type) => {
          this.$refs[type].wrap.onscroll = (e) => {
            // TODO: scroll is emitted when set scrollTop programatically
            // should find better solutions in the future!
            this.handleScroll(type, e);
          };
        };
        bindFuntion('hours');
        bindFuntion('minutes');
        bindFuntion('seconds');
      },

      handleScroll(type) {
        const value = Math.min(Math.round((this.$refs[type].wrap.scrollTop - (this.scrollBarHeight(type) * 0.5 - 10) / this.typeItemHeight(type) + 3) / this.typeItemHeight(type)), (type === 'hours' ? 23 : 59));
        // Ducr：调整当前已选时间的数据值
        if (type === 'minutes') {
          const item = this.minutesList[Math.min(value, this.minutesList.length - 1)];
          this.modifyDateField(type, item ? item.num : 0);
        } else if (type === 'seconds') {
          const item = this.secondsList[Math.min(value, this.secondsList.length - 1)];
          this.modifyDateField(type, item ? item.num : 0);
        } else {
          this.modifyDateField(type, value);
        }
      },

      // NOTE: used by datetime / date-range panel
      //       renamed from adjustScrollTop
      //       should try to refactory it
      adjustSpinners() {
        this.adjustSpinner('hours', this.hours);
        this.adjustSpinner('minutes', this.minutes);
        this.adjustSpinner('seconds', this.seconds);
      },

      adjustCurrentSpinner(type) {
        // Ducr：调整当前已选时间的面板被高亮选中
        if (type === 'minutes') {
          const val = this.queryApproximate(this[type], this.minutesList) || 0;
          this.adjustSpinner(type, this[type]);
        } else if (type === 'seconds') {
          const val = this.queryApproximate(this[type], this.secondsList) || 0;
          this.adjustSpinner(type, this[type]);
        } else {
          this.adjustSpinner(type, this[type]);
        }
      },

      adjustSpinner(type, value) {
        if (this.arrowControl) return;
        const el = this.$refs[type].wrap;
        if (el) {
          // Ducr：调整滚动的高度值
          if (type === 'minutes') {
            const val = this.queryApproximate(value, this.minutesList);
            const idx = this.minutesList.findIndex(item => item.num === val) || 0
            el.scrollTop = Math.max(0, idx * this.typeItemHeight(type));
          } else if (type === 'seconds') {
            const val = this.queryApproximate(value, this.secondsList);
            const idx = this.secondsList.findIndex(item => item.num === val) || 0
            el.scrollTop = Math.max(0, idx * this.typeItemHeight(type));
          } else {
            el.scrollTop = Math.max(0, value * this.typeItemHeight(type));
          }
        }
      },

      scrollDown(step) {
        if (!this.currentScrollbar) {
          this.emitSelectRange('hours');
        }

        const label = this.currentScrollbar;
        const hoursList = this.hoursList;
        let now = this[label];

        if (this.currentScrollbar === 'hours') {
          let total = Math.abs(step);
          step = step > 0 ? 1 : -1;
          let length = hoursList.length;
          while (length-- && total) {
            now = (now + step + hoursList.length) % hoursList.length;
            if (hoursList[now]) {
              continue;
            }
            total--;
          }
          if (hoursList[now]) return;
        } else {
          if (this.currentScrollbar === 'minutes') {
            if (+this.customMinuteStep !== 1) {
              const currMinute = this.queryApproximate(this.minutes, this.minutesList) || 0;
              const idx = this.minutesList.findIndex(item => item.num === currMinute) || 0;
              const prevMinute = (this.minutesList[idx - 1] || {}).num;
              const nextMinute = (this.minutesList[idx + 1] || {}).num;
              const minMinute = (this.minutesList[0] || {}).num;
              const maxMinute = (this.minutesList[this.minutesList.length - 1] || {}).num;
              if (step > 0) {
                now = now >= maxMinute ? minMinute : nextMinute;
              } else {
                now = now <= minMinute ? maxMinute : prevMinute;
              }
            } else {
              now = (now + step + 60) % 60;
            }
          }
          if (this.currentScrollbar === 'seconds') {
            if (+this.customSecondStep !== 1) {
              const currSecond = this.queryApproximate(this.seconds, this.secondsList) || 0;
              const idx = this.secondsList.findIndex(item => item.num === currSecond) || 0;
              const prevSecond = (this.secondsList[idx - 1] || {}).num;
              const nextSecond = (this.secondsList[idx + 1] || {}).num;
              const minSecond = (this.secondsList[0] || {}).num;
              const maxSecond = (this.secondsList[this.secondsList.length - 1] || {}).num;
              if (step > 0) {
                now = now >= maxSecond ? minSecond : nextSecond;
              } else {
                now = now <= minSecond ? maxSecond : prevSecond;
              }
            } else {
              now = (now + step + 60) % 60;
            }
          } 
        }

        this.modifyDateField(label, now);
        this.adjustSpinner(label, now);
        this.$nextTick(() => this.emitSelectRange(this.currentScrollbar));
      },
      amPm(hour) {
        let shouldShowAmPm = this.amPmMode.toLowerCase() === 'a';
        if (!shouldShowAmPm) return '';
        let isCapital = this.amPmMode === 'A';
        let content = (hour < 12) ? ' am' : ' pm';
        if (isCapital) content = content.toUpperCase();
        return content;
      },
      typeItemHeight(type) {
        return this.$refs[type].$el.querySelector('li').offsetHeight;
      },
      scrollBarHeight(type) {
        return this.$refs[type].$el.offsetHeight;
      },

      /**
       * @description 获取传入值与minutesList数组值中比较数组取接近值
       * @author Ducr
       * @param { String | Number } value 实际传入值
       * @returns { String | Number } minutesList数组中最接近value的值
       */
      queryApproximate(value, list = []) {
        return list.reduce((prev, curr) => {
          if (value >= curr.num) {
            return curr.num
          } else {
            return prev
          }
        }, 0)
      },

      /**
       * @description 根据传入的步距，生成指定步距范围的分钟数
       * @author Ducr
       * @param { Array } arr 待处理的原始数组
       * @param { String | Number } step 时间值的步距，最小为1，最大为59
       */
      generateRange(arr = [], step) {
        let currStep = 1;
        // 对步距值进行检查，取值在[1, 59]
        if (step && (typeof +step === 'number') && parseInt(+step)) {
          // currStep = Math.min(Math.max(parseInt(+step), 1), 59);
          currStep = Math.max(parseInt(+step), 1);
        }
        let newArr = [];
        // 步距大于59时，只开放0的数字面板
        if (currStep > 59) {
          newArr = [{ num: 0, enabled: !!arr[0] }];
        } else {
          // 此处用for循环，因为手动修改开始时间大于结束时间，会生成稀疏数组，map等方法会直接跳过稀疏值不处理
          for (let idx = 0; idx < arr.length; idx++) {
            let item = {};
            if ((idx % currStep) === 0) {
              item.num = idx;
              item.enabled = !!arr[idx];
            }
            newArr.push(item)
          }
        }
        newArr = newArr.filter(ele => ele.num || ele.num === 0);
        return newArr;
      }
    }
  };
</script>
