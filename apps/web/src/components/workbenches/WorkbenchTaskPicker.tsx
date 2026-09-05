import { useId } from 'react';

export type WorkbenchTaskOption = {
  value: string;
  label: string;
  group: string;
};

type WorkbenchTaskPickerProps = {
  value: string;
  options: readonly WorkbenchTaskOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

/**
 * The shared task switcher for focused workbenches.
 *
 * Keep this as a native select: task selection changes the visible lesson
 * surface, while the controls inside that surface perform the mathematics.
 */
export default function WorkbenchTaskPicker({
  value,
  options,
  onChange,
  disabled = false,
}: WorkbenchTaskPickerProps) {
  const id = useId();
  const groups = options.reduce<Record<string, WorkbenchTaskOption[]>>((result, option) => {
    (result[option.group] ??= []).push(option);
    return result;
  }, {});

  return (
    <div className="workbench-task-picker" data-workbench-task-picker>
      <label className="workbench-task-picker__label" htmlFor={id}>
        Choose a task
      </label>
      <select
        id={id}
        className="select-input workbench-task-picker__select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {Object.entries(groups).map(([group, groupOptions]) => (
          <optgroup key={group} label={group}>
            {groupOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
