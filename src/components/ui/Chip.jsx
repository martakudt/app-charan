import './ui.css'

export default function Chip({ label, active, onClick }) {
  return (
    <button className={`chip${active ? ' chip-active' : ''}`} onClick={onClick}>
      {label}
    </button>
  )
}
