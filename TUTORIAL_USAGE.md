# How to Use the Tutorial Feature

## Quick Start

### Accessing the Tutorial
1. Open the K8s Ingress Generator app
2. Click the **"Learn YAML"** button in the top navigation (blue button with graduation cap icon)
3. You'll be taken to the interactive tutorial screen

## Tutorial Flow

### Header Section
- **Tutorial Title**: "Deploy a Simple Web App"
- **Description**: What you'll learn
- **Duration**: Estimated time (5-10 minutes)
- **Exit Button**: Return to main builder anytime

### Progress Tracking
- **Progress Bar**: Shows overall completion percentage
- **Step Counter**: "Step X of Y"
- **Bottom Indicators**: Visual bars showing completed (green), current (blue), pending (gray) steps

## Step-by-Step Process

### Left Panel: Form & Instructions

Each step contains:

#### 1. Step Header
- Step number badge (turns green with checkmark when completed)
- Step title (e.g., "Step 1: Create a Deployment")
- Description of what you'll create

#### 2. Educational Content
- **Blue Box** - "What is a [resource]?"
  - Explains the Kubernetes resource concept
  - Plain language explanation

- **Yellow Box** - "Tips"
  - Best practices
  - Common patterns
  - Things to watch out for

#### 3. Form Fields
For each field you'll see:
- **Label** with asterisk (*) if required
- **Help icon** - Hover for detailed explanation
- **Input field** - Text, number, dropdown, or toggle
- **Help text** - Brief description
- **Example** - Code snippet showing valid values

#### 4. Navigation Buttons
- **Previous** - Go back to previous step (disabled on first step)
- **Next Step** - Proceed to next step (disabled until all required fields filled)
- **Finish** - On last step, mark completion
- **Complete & Build** - After all steps, export to main builder

### Right Panel: Live YAML Preview

Shows your configuration building up in real-time:

- **Monaco Editor** - Professional YAML editor with syntax highlighting
- **Copy Button** - Copy YAML to clipboard
- **Download Button** - Save as .yaml file
- **Progress Footer** - Shows how many resources configured

## Tutorial: Simple Web App

### Step 1: Create a Deployment
You'll configure:
- **Deployment Name**: Identifier for your deployment (e.g., "web-app")
- **Container Name**: Name for container inside pod (e.g., "web-container")
- **Docker Image**: Container image to run (e.g., "nginx:1.25")
- **Replicas**: Number of pod copies (e.g., 2)
- **Container Port**: Port your app listens on (e.g., 80)

**What you learn**: Deployments run your application containers and manage replicas.

**YAML Generated**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web-container
        image: nginx:1.25
        ports:
        - containerPort: 80
```

### Step 2: Create a Service
You'll configure:
- **Service Name**: Network identifier (e.g., "web-app-service")
- **Service Port**: Port clients connect to (e.g., 80)
- **Target Port**: Container port to forward to (matches Step 1)
- **Service Type**: How service is exposed (ClusterIP, NodePort, LoadBalancer)

**What you learn**: Services provide stable networking for pods.

**YAML Generated**:
```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
spec:
  type: ClusterIP
  selector:
    app: web-app  # Automatically links to deployment!
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
```

### Step 3: Create an Ingress
You'll configure:
- **Domain Name**: URL for your app (e.g., "myapp.example.com")
- **Path**: URL path to match (e.g., "/")
- **Backend Service**: Service to route to (from Step 2)
- **Service Port**: Port on service (from Step 2)
- **Ingress Controller**: Controller type (e.g., "nginx")
- **Enable HTTPS**: Toggle for TLS (optional)

**What you learn**: Ingress routes external traffic to your services.

**YAML Generated**:
```yaml
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-service-ingress
spec:
  ingressClassName: nginx
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app-service
            port:
              number: 80
```

## After Completion

When all steps are done:
1. Review the complete YAML in the right panel
2. Click **"Copy"** to copy to clipboard
3. Click **"Download"** to save as file
4. Click **"Complete & Build"** to import into main diagram builder (future feature)
5. Or click **"Exit Tutorial"** to return to main app

## Tips for Best Learning

1. **Read the explanations** - The blue and yellow boxes explain concepts
2. **Use the examples** - Copy example values to get started
3. **Hover on help icons** - Extra details and context
4. **Watch the YAML build** - See how form inputs translate to YAML
5. **Experiment** - Try different values and see YAML change
6. **Don't rush** - Take time to understand each resource

## Common Questions

### Can I go back and change previous steps?
Yes! Use the "Previous" button to go back and edit any step.

### What if I make a mistake?
No problem! You can edit any field at any time. YAML updates in real-time.

### Can I save my progress?
Currently no, but you can download the YAML at any time.

### Can I use this YAML in production?
The YAML is valid and can be deployed, but you should:
- Review security settings
- Adjust resource limits
- Configure appropriate secrets
- Set up proper TLS certificates

### Do I need Kubernetes knowledge?
No! The tutorial teaches you from scratch. The explanations and tips guide you through.

## Keyboard Shortcuts

- **Tab**: Move between fields
- **Enter**: Submit form (on last field)
- **Escape**: Exit tutorial (with confirmation)

## Browser Support

Works best on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires JavaScript enabled.

## Next Steps After Tutorial

1. Try the main **Diagram Builder** for visual creation
2. Explore **Templates** for more complex architectures
3. Read Kubernetes documentation for advanced features
4. Deploy your YAML to a real cluster!
