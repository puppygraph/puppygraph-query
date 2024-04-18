import React from 'react';
import ProfileDropdown from './ProfileDropdown';
import SystemStatusButton from './SystemStatusButton';

const HeaderDisplay = ({ loggedIn, userNavigation, handleMenuItemClick }) => {
    return (
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            {loggedIn && (
                <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                    <div className="relative flex flex-1"></div>
                    <div className="flex items-center gap-x-4 lg:gap-x-6">
                        <SystemStatusButton />
                        {/* Separator */}
                        <div
                            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10"
                            aria-hidden="true"
                        />
                        <ProfileDropdown
                            userNavigation={userNavigation}
                            handleMenuItemClick={handleMenuItemClick}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default HeaderDisplay;
