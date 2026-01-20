import React from 'react';

const AppSectionHeader = ({ title, description, actions }) => {
    return (
        <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">{title}</h1>
                    {description && <p className="text-muted-foreground mt-1">{description}</p>}
                </div>
                {actions && (
                    <div className="flex flex-wrap gap-2">{actions}</div>
                )}
            </div>
            <div className="h-px bg-border mt-2 mb-4" />
        </div>
    );
};

export default AppSectionHeader;
