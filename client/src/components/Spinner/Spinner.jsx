import classes from './Spinner.module.css';

export default function Spinner({ size = 16, color = '#22c55e', className = '', style = {} }) {
  return (
    <div
      className={`${classes.spinner} ${className}`}
      style={{
        '--spinner-size': `${size}px`,
        '--spinner-color': color,
        ...style,
      }}
    />
  );
}
