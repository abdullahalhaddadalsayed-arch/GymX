# GymX in-app updates — one-time setup

GymX's existing `v0.4` application and offline machine-recognition code remain intact. On each push to `main`, GitHub Actions builds a **debug testing APK**; after signing is configured it also builds a **permanently signed APK** and publishes a public GitHub Release named `GymX.apk`.

In the installed app: Settings → **Check for updates** → **Update GymX** → approve Android installer. The new APK updates `com.gymx.app` in place and keeps local records, provided the package name and signing certificate remain unchanged.

## One-time signing setup from your Samsung phone

Install Termux, then run `pkg install openjdk-17 gh coreutils` and `gh auth login --web`.

Create the signing key in a private directory, **never in the repository**. Keep an encrypted backup of the keystore and password outside GitHub; never send them through chat.

```sh
mkdir -p "$HOME/gymx-private-signing" && cd "$HOME/gymx-private-signing"
read -rsp 'Create a permanent GymX signing password: ' GYMX_PASSWORD; echo
keytool -genkeypair -keystore gymx-release.jks -alias gymx -keyalg RSA -keysize 3072 -validity 10000 -storepass "$GYMX_PASSWORD" -keypass "$GYMX_PASSWORD" -dname 'CN=GymX, OU=Personal, O=GymX, C=SA'
REPO='abdullahalhaddadalsayed-arch/GymX'
base64 -w 0 gymx-release.jks | gh secret set GYMX_RELEASE_KEYSTORE_B64 --repo "$REPO"
printf '%s' "$GYMX_PASSWORD" | gh secret set GYMX_KEYSTORE_PASSWORD --repo "$REPO"
printf '%s' "$GYMX_PASSWORD" | gh secret set GYMX_KEY_PASSWORD --repo "$REPO"
printf 'gymx' | gh secret set GYMX_KEY_ALIAS --repo "$REPO"
unset GYMX_PASSWORD
```

After securely storing the key/password, open [GitHub Actions](https://github.com/abdullahalhaddadalsayed-arch/GymX/actions), select **Build GymX and publish signed updates**, then click **Run workflow**. When the run succeeds, find the signed installer under [GitHub Releases](https://github.com/abdullahalhaddadalsayed-arch/GymX/releases).

## Important signing migration

Older GymX debug APKs use a different signing certificate and **cannot be updated in-place** by the new permanent release key. First export and verify your GymX workout/photo backup. Then install the first permanently signed version (may require uninstalling the old debug build) and import the backup. After that, future signed releases can update the same app while keeping data.

## Scope and limitations

- All new screens, native features, databases, workout images and bug fixes can ship in the versioned APK.
- The new APK is downloaded **inside GymX**; you won't need to hunt for it manually.
- Android may ask for one-time unknown-apps permission and **must approve each update installation**; GymX cannot silently override the OS.
- The public repository/release distributes the APK but **does not publish local workout history or progress photos**.
- No signing key is generated or held by ChatGPT. Configure GitHub Actions secrets yourself.
- Changing the application ID, signing certificate, or resetting versionCode breaks in-place installation.
- Source integration and CI checks are not equivalent to a successful device installation; verify on the S26 Ultra after the first signed release.
