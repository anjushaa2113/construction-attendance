const Card = ({ children, className = "", hover = true }) => {
    return (
        <div className={`premium-card ${className} ${hover ? 'hover:-translate-y-1 hover:shadow-lg' : ''}`}>
            {children}
        </div>
    );
};
export default Card;
