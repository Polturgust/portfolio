#!/bin/sh
# Runs inside an i386/alpine container. See build.sh.
# Produces a Linux kernel and an initramfs whose init starts the project's 42sh.
set -eu

SRC=/src          # my-shell checkout (read-only)
TOOLS=/tools      # this folder
OUT=/out

apk add --no-cache gcc musl-dev make linux-virt busybox-static cpio >/dev/null

# --- 42sh: the project's own sources and Makefile, linked statically -------
rm -rf /work && cp -r "$SRC" /work && cd /work
make -s buildlib
make -s all CFLAGS='-I./include/ -O2 -Wall -Wextra -static -L./lib -lmy -llist' \
    2>&1 | grep -v "^make" || true
test -x 42sh
strip 42sh

# --- root filesystem --------------------------------------------------------
ROOT=/rootfs
rm -rf "$ROOT" && mkdir -p "$ROOT"/bin "$ROOT"/sbin "$ROOT"/usr/bin "$ROOT"/usr/sbin \
    "$ROOT"/dev "$ROOT"/proc "$ROOT"/sys "$ROOT"/tmp "$ROOT"/etc "$ROOT"/home/guest
cp /bin/busybox.static "$ROOT"/bin/busybox
chroot "$ROOT" /bin/busybox --install -s
cp 42sh "$ROOT"/bin/42sh
cp "$SRC"/.myshrc "$ROOT"/home/guest/.myshrc
cp "$TOOLS"/rootfs/init "$ROOT"/init
cp -r "$TOOLS"/rootfs/home/guest/. "$ROOT"/home/guest/
chmod 755 "$ROOT"/init
echo "guest:x:1000:1000:guest:/home/guest:/bin/42sh" > "$ROOT"/etc/passwd
echo "root:x:0:0:root:/root:/bin/sh" >> "$ROOT"/etc/passwd
echo "guest:x:1000:" > "$ROOT"/etc/group
echo "42sh" > "$ROOT"/etc/hostname
printf "/bin/sh\n/bin/42sh\n" > "$ROOT"/etc/shells

cd "$ROOT" && find . | cpio -o -H newc 2>/dev/null | gzip -9 > "$OUT"/initramfs.cpio.gz
cp /boot/vmlinuz-virt "$OUT"/bzImage
ls -l "$OUT"
