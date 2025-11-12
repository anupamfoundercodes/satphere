function logout() {
    localStorage.removeItem('token');
    window.location.href = 'signin';
    console.log("Button Clicked")
}