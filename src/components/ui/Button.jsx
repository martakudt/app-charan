import './ui.css'

export default function Button({ children, variant = 'primary', size, disabled, onClick, type = 'button' }) {
  const classes = `btn btn-${variant}${size === 'sm' ? ' btn-sm' : ''}`
  return (
    <button className={classes} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  )
}
