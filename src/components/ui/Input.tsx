import { type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode, forwardRef } from 'react'

interface InputBaseProps {
  label?: string
  helper?: string
  error?: string
  iconLeft?: ReactNode
}

type InputFieldProps = InputBaseProps &
  InputHTMLAttributes<HTMLInputElement> & {
    multiline?: false
  }

type TextareaFieldProps = InputBaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    multiline: true
  }

type InputProps = InputFieldProps | TextareaFieldProps

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  function Input(props, ref) {
    const { label, helper, error, iconLeft, multiline, className = '', ...rest } = props

    const fieldClass = `${multiline ? 'textarea-field' : 'input-field'} ${error ? 'input-field-error' : ''} ${className}`

    return (
      <div className="input-group">
        {label && <label className="input-label">{label}</label>}

        {iconLeft && !multiline ? (
          <div className="input-with-icon">
            <span className="input-icon">{iconLeft}</span>
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              className={fieldClass}
              {...(rest as InputHTMLAttributes<HTMLInputElement>)}
            />
          </div>
        ) : multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={fieldClass}
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            className={fieldClass}
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {error && <span className="input-error-text">{error}</span>}
        {helper && !error && <span className="input-helper">{helper}</span>}
      </div>
    )
  }
)

export default Input
