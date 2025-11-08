<template>
  <transition
    name="el-zoom-in-top"
    @after-leave="$emit('dodestroy')">
    <div
      v-show="visible"
      class="el-time-range-picker el-picker-panel el-popper"
      :class="popperClass">
      <div class="el-time-range-picker__content">
        <div class="el-time-range-picker__cell">
          <div class="el-time-range-picker__header">{{ t('el.datepicker.startTime') }}</div>
          <div
            :class="{ 'has-seconds': showSeconds, 'is-arrow': arrowControl }"
            class="el-time-range-picker__body el-time-panel__content">
            <time-spinner
              ref="minSpinner"
              :show-seconds="showSeconds"
              :am-pm-mode="amPmMode"
              :custom-minute-step="customMinuteStep"
              :custom-second-step="customSecondStep"
              @change="handleMinChange"
              :arrow-control="arrowControl"
              @select-range="setMinSelectionRange"
              :date="minDate">
            </time-spinner>
          </div>
        </div>
        <div class="el-time-range-picker__cell">
          <div class="el-time-range-picker__header">{{ t('el.datepicker.endTime') }}</div>
          <div
            :class="{ 'has-seconds': showSeconds, 'is-arrow': arrowControl }"
            class="el-time-range-picker__body el-time-panel__content">
            <time-spinner
              ref="maxSpinner"
              :show-seconds="showSeconds"
              :am-pm-mode="amPmMode"
              :custom-minute-step="customMinuteStep"
              :custom-second-step="customSecondStep"
              @change="handleMaxChange"
              :arrow-control="arrowControl"
              @select-range="setMaxSelectionRange"
              :date="maxDate">
            </time-spinner>
          </div>
        </div>
      </div>
      <div class="el-time-panel__footer">
        <button
          type="button"
          class="el-time-panel__btn cancel"
          @click="handleCancel()">{{ t('el.datepicker.cancel') }}</button>
        <button
          type="button"
          class="el-time-panel__btn confirm"
          @click="handleConfirm()"
          :disabled="btnDisabled">{{ t('el.datepicker.confirm') }}</button>
      </div>
    </div>
  </transition>
</template>

<script type="text/babel">
  import {
    formatDate,
    parseDate,
    limitTimeRange,
    modifyDate,
    clearMilliseconds,
    timeWithinRange
  } from '../../utils/date-util';
  import Locale from '../../mixins/locale';
  import TimeSpinner from '../basic/time-spinner';

  const MIN_TIME = parseDate('00:00:00', 'HH:mm:ss');
  const MAX_TIME = parseDate('23:59:59', 'HH:mm:ss');

  const minTimeOfDay = function(date) {
    return modifyDate(MIN_TIME, date.getFullYear(), date.getMonth(), date.getDate());
  };
  
  const maxTimeOfDay = function(date) {
    return modifyDate(MAX_TIME, date.getFullYear(), date.getMonth(), date.getDate());
  };

  // increase time by amount of milliseconds, but within the range of day
  const advanceTime = function(date, amount) {
    return new Date(Math.min(date.getTime() + amount, maxTimeOfDay(date).getTime()));
  };

  export default {
    mixins: [Locale],

    components: { TimeSpinner },

    props: {
      customMinuteStep: [String, Number], // 分钟数自定义步距
      customSecondStep: [String, Number], // 秒钟数自定义步距
    },

    computed: {
      showSeconds() {
        return (this.format || '').indexOf('ss') !== -1;
      },

      offset() {
        return this.showSeconds ? 11 : 8;
      },

      spinner() {
        return this.selectionRange[0] < this.offset ? this.$refs.minSpinner : this.$refs.maxSpinner;
      },

      btnDisabled() {
        return this.minDate.getTime() > this.maxDate.getTime();
      },
      amPmMode() {
        if ((this.format || '').indexOf('A') !== -1) return 'A';
        if ((this.format || '').indexOf('a') !== -1) return 'a';
        return '';
      }
    },

    data() {
      return {
        popperClass: '',
        minDate: new Date(),
        maxDate: new Date(),
        value: [],
        oldValue: [new Date(), new Date()],
        defaultValue: null,
        format: 'HH:mm:ss',
        visible: false,
        selectionRange: [0, 2],
        arrowControl: false
      };
    },

    watch: {
      value(value) {
        if (Array.isArray(value)) {
          // Ducr：在外部传入值变化时，确保 minDat 与 maxDate 的年月日为同一天，解决跨天时间戳比对错误的问题
          value = this.normalizeDates(value);
          // Ducr：代码健壮性判断，若传入值为空，则保持原有值不变
          this.minDate = new Date(value[0] ? value[0] : this.minDate);
          this.maxDate = new Date(value[1] ? value[1] : this.maxDate);
          // Ducr：在使用箭头控制时，确保分钟、秒钟数为步距数，非使用箭头控制时，该逻辑会导致滚动选择的值被重置
          if (this.arrowControl) {
            this.minDate && this.handleValidateTimeNumAndFormat('minSpinner', 'minDate');
            this.maxDate && this.handleValidateTimeNumAndFormat('maxSpinner', 'maxDate');
          }
          // Ducr：在input手动输入时，确保 minDate 不大于 maxDate，并对应调整当前已选时间的面板被高亮选中
          if (this.maxDate && this.maxDate.getTime() < this.minDate.getTime()) {
            this.maxDate = new Date(this.minDate);
            this.handleChange();
            this.$nextTick(() => {
              this.$refs.minSpinner.adjustSpinners();
              this.$refs.maxSpinner.adjustSpinners();
            });
          }
          if (this.maxDate && this.minDate && this.minDate.getTime() > this.maxDate.getTime()) {
            this.minDate = new Date(this.maxDate);
            this.handleChange();
            this.$nextTick(() => {
              this.$refs.minSpinner.adjustSpinners();
              this.$refs.maxSpinner.adjustSpinners();
            });
          }
        } else {
          if (Array.isArray(this.defaultValue)) {
            // Ducr：在外部传入默认值时，确保 minDat 与 maxDate 的年月日为同一天，解决跨天时间戳比对错误的问题
            const defaultValue = this.normalizeDates(this.defaultValue);
            this.minDate = new Date(defaultValue[0]);
            this.maxDate = new Date(defaultValue[1]);
            // Ducr：在使用箭头控制时，确保分钟、秒钟数为步距数，非使用箭头控制时，该逻辑会导致滚动选择的值被重置
            if (this.arrowControl) {
              this.minDate && this.handleValidateTimeNumAndFormat('minSpinner', 'minDate');
              this.maxDate && this.handleValidateTimeNumAndFormat('maxSpinner', 'maxDate');
            }
          } else if (this.defaultValue) {
            this.minDate = new Date(this.defaultValue);
            this.maxDate = advanceTime(new Date(this.defaultValue), 60 * 60 * 1000);
          } else {
            this.minDate = new Date();
            this.maxDate = advanceTime(new Date(), 60 * 60 * 1000);
          }
        }
      },

      visible(val) {
        if (val) {
          this.oldValue = this.value;
          this.$nextTick(() => this.$refs.minSpinner.emitSelectRange('hours'));
        }
      }
    },

    methods: {
      handleClear() {
        this.$emit('pick', null);
      },

      handleCancel() {
        this.$emit('pick', this.oldValue);
      },

      handleMinChange(date) {
        // Ducr：在点击面板修改时，确保 minDate 不大于 maxDate，并对应调整当前已选时间的面板被高亮选中
        const _minDate = clearMilliseconds(date);
        if (!this.maxDate || this.maxDate && this.maxDate.getTime() < _minDate.getTime()) {
          this.maxDate = new Date(_minDate);
          this.$nextTick(() => {
            this.$refs.maxSpinner.adjustSpinners();
          });
        }
        this.minDate = clearMilliseconds(date);
        this.handleChange();
      },

      handleMaxChange(date) {
        // Ducr：在点击面板修改时，确保 minDate 不大于 maxDate，并对应调整当前已选时间的面板被高亮选中
        const _maxDate = clearMilliseconds(date);
        if (this.maxDate && this.minDate && this.minDate.getTime() > _maxDate.getTime()) {
          this.minDate = new Date(_maxDate);
          this.$nextTick(() => {
            this.$refs.minSpinner.adjustSpinners();
          });
        }
        this.maxDate = clearMilliseconds(date);
        this.handleChange();
      },

      handleChange() {
        if (
          // Ducr: 原有逻辑，确保 minDate 与 maxDate 为合法值
          this.isValidValue([this.minDate, this.maxDate]) ||
          // Ducr: 当 minDate 与 maxDate 为非法值时，前面change事件中已调整二者相等，确保二者相等时也能触发 pick 事件
          (!this.isValidValue([this.minDate, this.maxDate]) && this.minDate.getTime() === this.maxDate.getTime())
      ) {
          this.$refs.minSpinner.selectableRange = [[minTimeOfDay(this.minDate), this.maxDate]];
          this.$refs.maxSpinner.selectableRange = [[this.minDate, maxTimeOfDay(this.maxDate)]];
          this.$emit('pick', [this.minDate, this.maxDate], true);
        }
      },

      /**
       * @description 将日期的年月日调整为同一天，保持原有的时分秒，element-ui默认处理的日期会出现跨天问题
       * @author Ducr
       * @param { Array } dates 日期数组
       * @param { Date } baseDate 基准日期，默认当天
       * @return { Array } 调整后的日期数组
       */
      normalizeDates(dates, baseDate = new Date()) {
        if (!Array.isArray(dates) || dates.length === 0) {
          return dates;
        }
        const baseYear = baseDate.getFullYear();
        const baseMonth = baseDate.getMonth();
        const baseDay = baseDate.getDate();
        return dates.map(date => {
          const curDate = new Date(date);
          const hours = curDate.getHours();
          const minutes = curDate.getMinutes();
          const seconds = curDate.getSeconds();
          const milliseconds = curDate.getMilliseconds();
          return new Date(
            baseYear,
            baseMonth,
            baseDay,
            hours,
            minutes,
            seconds,
            milliseconds
          );
        });
      },

      setMinSelectionRange(start, end) {
        this.$emit('select-range', start, end, 'min');
        this.selectionRange = [start, end];
      },

      setMaxSelectionRange(start, end) {
        this.$emit('select-range', start, end, 'max');
        this.selectionRange = [start + this.offset, end + this.offset];
      },

      handleConfirm(visible = false) {
        const minSelectableRange = this.$refs.minSpinner.selectableRange;
        const maxSelectableRange = this.$refs.maxSpinner.selectableRange;

        this.minDate = limitTimeRange(this.minDate, minSelectableRange, this.format);
        this.maxDate = limitTimeRange(this.maxDate, maxSelectableRange, this.format);

        this.$emit('pick', [this.minDate, this.maxDate], visible);
      },

      adjustSpinners() {
        this.$refs.minSpinner.adjustSpinners();
        this.$refs.maxSpinner.adjustSpinners();
      },

      changeSelectionRange(step) {
        const list = this.showSeconds ? [0, 3, 6, 11, 14, 17] : [0, 3, 8, 11];
        const mapping = ['hours', 'minutes'].concat(this.showSeconds ? ['seconds'] : []);
        const index = list.indexOf(this.selectionRange[0]);
        const next = (index + step + list.length) % list.length;
        const half = list.length / 2;
        if (next < half) {
          this.$refs.minSpinner.emitSelectRange(mapping[next]);
        } else {
          this.$refs.maxSpinner.emitSelectRange(mapping[next - half]);
        }
      },

      isValidValue(date) {
        return Array.isArray(date) &&
          timeWithinRange(this.minDate, this.$refs.minSpinner.selectableRange) &&
          timeWithinRange(this.maxDate, this.$refs.maxSpinner.selectableRange);
      },

      handleKeydown(event) {
        const keyCode = event.keyCode;
        const mapping = { 38: -1, 40: 1, 37: -1, 39: 1 };

        // Left or Right
        if (keyCode === 37 || keyCode === 39) {
          const step = mapping[keyCode];
          this.changeSelectionRange(step);
          event.preventDefault();
          return;
        }

        // Up or Down
        if (keyCode === 38 || keyCode === 40) {
          const step = mapping[keyCode];
          this.spinner.scrollDown(step);
          event.preventDefault();
          return;
        }
      },

      /**
       * @description 处理分钟、秒钟数为非步距数时，进行合法化处理
       * @author Ducr
       * @param { String } pickerType 实例名的key，minSpinner还是maxSpinner
       * @param { String } dateKey 时间值的key，minDate还是maxDate
       */
      handleValidateTimeNumAndFormat(pickerType, dateKey) {
        if (this.$refs[pickerType]) {
          const timeSpinnerVm = this.$refs[pickerType];
          const { minutesList = [], secondsList = [], queryApproximate = ((val, list = []) => val) } = timeSpinnerVm;
          const currDate = this[dateKey] ? this[dateKey] : new Date();
          let currMinNum = queryApproximate(+formatDate(currDate, 'mm'), minutesList);
          let currSecNum = queryApproximate(+formatDate(currDate, 'ss'), secondsList);
          const parsedDate = new Date(currDate);
          parsedDate.setMinutes(('0' + currMinNum).slice(-2));
          parsedDate.setSeconds(('0' + currSecNum).slice(-2));
          this[dateKey] = parsedDate;
          // Ducr：此修改会导致直接修改实例props，报Vue警告
          // this.$refs[pickerType].date = parsedDate;
          this.$refs[pickerType].value = parsedDate;
          this.$refs[pickerType].adjustSpinners();
        }
      },
    }
  };
</script>
