const Select = ({ children, ...props }) => {
    return <select className="select" {...props}>{children}</select>;
};
export default Select;
