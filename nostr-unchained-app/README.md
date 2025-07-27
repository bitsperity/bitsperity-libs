# Nostr Unchained App

A Svelte-based demo application for the [nostr-unchained](../nostr-unchained) library.

## Local Development Setup

This app uses the local `nostr-unchained` library. Follow these steps:

1. **Setup the library first**:
   ```bash
   cd nostr-unchained
   npm install
   npm run build
   ```

2. **Setup the app**:
   ```bash
   cd ../nostr-unchained-app
   npm install
   ```

## Developing

Once you've set up dependencies, start the development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Common Issue: npm install fails

**Problem**: You might see errors like:
```
npm error ENOENT: no such file or directory, open '/path/to/nostr-unchained-0.1.0.tgz'
```
or
```
npm error sha512-... integrity checksum failed
```
or
```
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "link:": link:../nostr-unchained
```

**Solution**: 
1. Clean up:
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   ```
2. Follow the setup steps above

**Why this happens**: These errors occur when npm tries to use corrupted tarball files. The app now uses `file:../nostr-unchained` which points directly to the local directory.

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.
