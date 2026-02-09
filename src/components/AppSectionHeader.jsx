import React from 'react';

const AppSectionHeader = ({ title, description, actions }) => {
    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">{title}</h1>
                    {description && <p className="text-muted-foreground leading-relaxed max-w-3xl">{description}</p>}
                </div>
                {actions && (
                    <div className="flex flex-wrap gap-2">{actions}</div>
                )}
            </div>
            <div className="h-px bg-border/80 mt-1 mb-4" />
        </div>
    );
};

export default AppSectionHeader;
