import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

const Breadcrumb = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <nav className="flex items-center text-sm text-gray-500 mb-6">
            <Link to="/admin/dashboard" className="hover:text-gray-900 transition-colors">
                <Home className="h-4 w-4" />
            </Link>
            {pathnames.slice(1).map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 2).join('/')}`;
                const isLast = index === pathnames.length - 2;

                // Custom formatting for known routes
                let displayName = capitalize(name.replace('-', ' '));
                if (name === 'staff') displayName = 'Staff Directory';

                return (
                    <React.Fragment key={name}>
                        <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
                        {isLast ? (
                            <span className="font-medium text-gray-900">{displayName}</span>
                        ) : (
                            <Link to={routeTo} className="hover:text-gray-900 transition-colors">
                                {displayName}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumb;
