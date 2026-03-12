# Maintainer: Gökhan C. <caygkhan@gmail.com>
pkgname=waykey
pkgver=1.0.0
pkgrel=1
pkgdesc="Next-generation Wayland-compatible automation engine (AutoHotkey alternative)"
arch=('x86_64')
url="https://github.com/gkhanC/Waykey"
license=('MIT')
depends=('nodejs' 'hyprland' 'libevdev' 'polkit')
makedepends=('npm' 'cmake' 'make' 'gcc')
install=waykey.install
# Normally this would be a real source, but for local reference we use the local root
source=()

package() {
    # In a real PKGBUILD, we would cd into srcdir/waykey
    # Assuming this PKGBUILD is run from the project root directory during dev:
    local_src="$PWD"
    
    mkdir -p "${pkgdir}/opt/waykey"
    
    cp -r "${local_src}/package.json" "${pkgdir}/opt/waykey/"
    cp -r "${local_src}/package-lock.json" "${pkgdir}/opt/waykey/" 2>/dev/null || true
    cp -r "${local_src}/src" "${pkgdir}/opt/waykey/"
    cp -r "${local_src}/public" "${pkgdir}/opt/waykey/"
    cp -r "${local_src}/scripts" "${pkgdir}/opt/waykey/"
    cp -r "${local_src}/build" "${pkgdir}/opt/waykey/"
    cp "${local_src}/index.js" "${pkgdir}/opt/waykey/"
    cp "${local_src}/run.js" "${pkgdir}/opt/waykey/"
    
    cd "${pkgdir}/opt/waykey" && npm install --production
    
    # Systemd service
    install -Dm644 "${local_src}/waykey.service" "${pkgdir}/usr/lib/systemd/user/waykey.service"
    
    # Udev rules
    install -Dm644 "${local_src}/udev/99-waykey-uinput.rules" "${pkgdir}/etc/udev/rules.d/99-waykey-uinput.rules"
    
    # Wrapper bin
    install -Dm755 "${local_src}/waykey.sh" "${pkgdir}/usr/bin/waykey"
}
