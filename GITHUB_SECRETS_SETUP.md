# 🔑 GitHub Secrets Configuration Guide

## Quick Setup: GitHub Repository Secrets

### Step 1: Access Repository Secrets
1. Go to your GitHub repository: `https://github.com/your-username/GameOne`
2. Click the **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Get Vercel Information

#### A. Get Vercel Token
1. Visit: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Enter name: `GitHub Actions CI/CD`
4. Click **"Create"**
5. **Copy the token** (starts with `vercel_...`)

#### B. Get Vercel Organization ID
1. Go to: https://vercel.com/teams/settings (or account settings)
2. Look for **"Team ID"** or **"Personal Account ID"**
3. Copy this value

#### C. Get Vercel Project ID
1. Go to your Vercel project dashboard
2. Click **Settings** tab
3. Under **General**, find **"Project ID"**
4. Copy this value

### Step 3: Add Secrets to GitHub

Click **"New repository secret"** and add each secret:

#### Secret #1: VERCEL_TOKEN
```
Name: VERCEL_TOKEN
Value: [Paste your Vercel token here]
```

#### Secret #2: VERCEL_ORG_ID
```
Name: VERCEL_ORG_ID
Value: [Paste your Vercel organization/team ID here]
```

#### Secret #3: VERCEL_PROJECT_ID
```
Name: VERCEL_PROJECT_ID
Value: [Paste your Vercel project ID here]
```

### Step 4: Optional Secrets (Recommended)

#### Secret #4: CODECOV_TOKEN (Optional)
1. Go to: https://codecov.io
2. Sign up with GitHub
3. Add your repository
4. Get the upload token
```
Name: CODECOV_TOKEN
Value: [Your Codecov token]
```

#### Secret #5: SEMGREP_APP_TOKEN (Optional)
1. Go to: https://semgrep.dev
2. Sign up with GitHub
3. Create a new token
```
Name: SEMGREP_APP_TOKEN
Value: [Your Semgrep token]
```

### ✅ Verification

After adding secrets, your repository should have:
- ✅ VERCEL_TOKEN
- ✅ VERCEL_ORG_ID
- ✅ VERCEL_PROJECT_ID
- ✅ CODECOV_TOKEN (optional)
- ✅ SEMGREP_APP_TOKEN (optional)

### 🧪 Test Your Setup

1. **Create a test branch**:
   ```bash
   git checkout -b test-cicd
   git push origin test-cicd
   ```

2. **Create a Pull Request**:
   - Go to GitHub
   - Create PR from `test-cicd` to `develop`
   - Watch the GitHub Actions run

3. **Check Actions Tab**:
   - Go to **Actions** tab in your repository
   - You should see the CI pipeline running
   - All checks should pass ✅

### 🚀 Deploy to Staging

1. **Merge to develop**:
   ```bash
   git checkout develop
   git merge test-cicd
   git push origin develop
   ```

2. **Watch Deployment**:
   - Check **Actions** tab for deployment status
   - Check Vercel dashboard for deployment

### 🏆 Deploy to Production

1. **Merge to master**:
   ```bash
   git checkout master
   git merge develop
   git push origin master
   ```

2. **Production Deployment**:
   - Check **Actions** tab
   - Your app will be live on Vercel!

## 🔧 Common Issues & Solutions

### Issue: "Repository secret not found"
**Solution**: Double-check secret names match exactly:
- `VERCEL_TOKEN` (not `VERCEL_ACCESS_TOKEN`)
- `VERCEL_ORG_ID` (not `VERCEL_TEAM_ID`)
- `VERCEL_PROJECT_ID` (not `PROJECT_ID`)

### Issue: "Vercel deployment failed"
**Solution**: 
1. Check if your Vercel token has correct permissions
2. Verify the organization ID matches your account
3. Ensure the project ID is from the correct project

### Issue: "Build failed"
**Solution**:
1. Run `bun run build` locally first
2. Fix any TypeScript errors
3. Ensure all environment variables are set in Vercel

## 📞 Need Help?

1. **Check GitHub Actions logs** for detailed error messages
2. **Verify all secrets** are correctly configured
3. **Test locally** before deploying
4. **Review the full setup guide** in `SETUP_GUIDE.md`

---

Your CI/CD pipeline is now ready! 🎉