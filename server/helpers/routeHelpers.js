/// Function to determine if a route is active based on the current route
function isActiveRoute(route, currentRoute) {
    // Return 'active' if both routes match, otherwise return an empty string
    return route === currentRoute ? 'active' : '';
}

module.exports = { isActiveRoute };
