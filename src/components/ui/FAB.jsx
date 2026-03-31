import './ui.css'

export default function FAB({ onClick }) {
  return (
    <button className="fab" onClick={onClick} aria-label="Añadir">
      +
    </button>
  )
}
