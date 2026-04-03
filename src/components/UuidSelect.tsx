import { Select } from 'antd';
import {
  ariaDescribedByIds,
  type FormContextType,
  type GenericObjectType,
  type RJSFSchema,
  type StrictRJSFSchema,
  type WidgetProps,
} from '@rjsf/utils';

const SELECT_STYLE = {
  width: '100%',
};

export default function UuidSelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  autofocus,
  disabled,
  formContext = {} as F,
  id,
  multiple,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  readonly,
  value,
}: WidgetProps<T, S, F>) {
  const { readonlyAsDisabled = true, uuids } = formContext as GenericObjectType;
  const { uuid_select_path } = options;

  const handleChange = (nextValue: string) => onChange(nextValue);
  const handleBlur = () => onBlur(id, value);
  const handleFocus = () => onFocus(id, value);

  const getPopupContainer = (node: any) => node.parentNode;

  const extraProps = {
    name: id,
  };

  const selectOptions = uuids[uuid_select_path as string];

  return (
    <Select
      autoFocus={autofocus}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      getPopupContainer={getPopupContainer}
      id={id}
      mode={multiple ? 'multiple' : undefined}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      style={SELECT_STYLE}
      value={value}
      {...extraProps}
      aria-describedby={ariaDescribedByIds<T>(id)}
      options={selectOptions}
    />
  );
}
