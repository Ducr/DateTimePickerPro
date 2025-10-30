import TimePickerPro from './src/picker/time-picker';
import DateTimePickerPro from './src/picker/date-picker';

/* istanbul ignore next */
TimePickerPro.install = function(Vue) {
  Vue.component(TimePickerPro.name, TimePickerPro);
};
/* istanbul ignore next */
DateTimePickerPro.install = function install(Vue) {
  Vue.component(DateTimePickerPro.name, DateTimePickerPro);
};

export {
  TimePickerPro,
  DateTimePickerPro,
};

export default DateTimePickerPro;