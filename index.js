import DateTimePickerPro from './src/picker/date-picker';

/* istanbul ignore next */
DateTimePickerPro.install = function install(Vue) {
  Vue.component(DateTimePickerPro.name, DateTimePickerPro);
};

export default DateTimePickerPro;