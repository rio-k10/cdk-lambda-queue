# CDK Lambda Queue Prototype

This project is a prototype CDK stack for deploying Lambda and SQS resources using AWS CDK in TypeScript. It uses `.env` files for team-specific AWS profile configuration and separates setup, plan, and deploy stages cleanly.

---

## 🛠 Local Setup

### 1. Install Prerequisites

Make sure you have the following installed globally:

- **AWS CLI**  
  [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)

  ```bash
  aws --version
  ```

- **AWS CDK CLI**  
  [Install AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#cli)
  ```bash
  npm install -g aws-cdk
  cdk --version
  ```

---

### 2. Clone and Setup the Project

```bash
git clone https://github.com/rio-k10/cdk-lambda-queue.git
cd cdk-lambda-queue-prototype
```

---

### 3. Create a `.env` File

Copy the example to your local environment:

```bash
cp .env.template .env
```

Edit `.env` and set your AWS SSO profile:

```env
AWS_PROFILE=tmsandbox
```

---

### 4. Install Project Dependencies

```bash
npm install
```

### 5. Login to AWS

```bash
aws sso login --profile <your_sso_profile_name>
```

---

### 6. Build and Synthesize the Stack

This generates the CloudFormation templates from your CDK code:

```bash
npm run plan
```

---

### 7. Deploy to AWS

```bash
npm run apply
```

---

### 8. Destroy the Stack

When you're finished, clean up your sandbox:

```bash
npm run destroy
```

---

## 🔧 Scripts Summary

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run plan`    | Synthesizes CDK stack             |
| `npm run apply`   | Deploys the stack to AWS          |
| `npm run destroy` | Tears down your AWS stack         |
| `npm run diff`    | Shows changes from deployed state |

---

## 📂 .env.example

```env
AWS_PROFILE=tmsandbox
```

Add this to `.gitignore`:

```gitignore
.env
```
