import dayjs from 'dayjs';
import {
  ariaDescribedByIds,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { DatePicker } from 'antd';

const DATE_PICKER_STYLE = {
  width: '100%',
};

export default function CustomizableDateWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    disabled,
    formContext,
    id,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    readonly,
    value,
    options,
  } = props;
  const { readonlyAsDisabled = true } = formContext as GenericObjectType;

  const handleChange = (nextValue: any) =>
    onChange(nextValue && nextValue.format('YYYY-MM-DD'));

  const handleBlur = () => onBlur(id, value);

  const handleFocus = () => onFocus(id, value);

  return (
    <DatePicker
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      format={options?.format}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      showTime={false}
      style={DATE_PICKER_STYLE}
      value={value && dayjs(value)}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}
