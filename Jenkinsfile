pipeline {
  agent any

  environment {
    FE_IMAGE = 'yourdockerhub/nextjs-fe'
    BE_IMAGE = 'yourdockerhub/express-be'
    FE_DIR = 'client'
    BE_DIR = 'server'
  }

  stages {
    stage('Checkout') {
      steps {
        echo "Checking out source code"
        checkout scm
      }
    }

   stage('Version') {
    steps {
        script {
            def version = sh(script: 'docker --version', returnStdout: true).trim()
            echo "Version: ${version}"
        }
    }
}


//     stage('Install & Build Frontend (Next.js)') {
//       steps {
//         dir("${FE_DIR}") {
//           echo " Installing frontend dependencies"
//           sh 'npm install'
          
//           echo "Building frontend"
//           sh 'npm run build'
//         }
//       }
//     }

//     stage('Install & Test Backend (Express.js)') {
//       steps {
//         dir("${BE_DIR}") {
//           echo "Installing backend dependencies"
//           sh 'npm install'

//           echo "Running backend tests"
//           sh 'npm test || echo "⚠️ Tests failed but continuing..."'
//         }
//       }
//     }

//     stage('Build Docker Images') {
//       steps {
//         echo "Building Docker images"

//         dir("${FE_DIR}") {
//           sh "docker build -t ${FE_IMAGE}:latest ."
//         }

//         dir("${BE_DIR}") {
//           sh "docker build -t ${BE_IMAGE}:latest ."
//         }

//         sh "docker image ls"
//       }
//     }

//     stage('Push Docker Images') {
//       steps {
//         withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
//           sh 'echo $DOCKER_PASSWORD | docker login --username $DOCKER_USERNAME --password-stdin'

//           sh "docker push ${FE_IMAGE}:latest"
//           sh "docker push ${BE_IMAGE}:latest"
//         }
//       }
//     }

//     stage('Deploy') {
//       steps {
//         echo "🚀 Deploying containers (customize this step as needed)"
//         // Có thể dùng ssh hoặc docker compose để triển khai lên VPS/server
//         // Ví dụ:
//         // sh 'ssh user@server "docker pull ..."'
//       }
//     }
//   }

//   post {
//     success {
//       echo "Pipeline completed successfully"
//     }
//     failure {
//       echo "Pipeline failed"
//     }
  }
}
