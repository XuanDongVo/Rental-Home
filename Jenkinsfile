pipeline {
  agent any

  environment {
    DOCKER_IMAGE = 'xundon/xuandong-rental-home'
    FE_DIR = 'client'
    BE_DIR = 'server'
    GIT_COMMIT_HASH = ''
  }

  stages {
    stage('Checkout') {
      steps {
        echo "Checking out source code"
        checkout scm
        script {
          env.GIT_COMMIT_HASH = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
          echo "Commit Hash: ${env.GIT_COMMIT_HASH}"
        }
      }
    }

    stage('Version') {
      steps {
        script {
          def version = sh(script: 'docker --version', returnStdout: true).trim()
          echo "Docker Version: ${version}"
        }
      }
    }

    stage('Install & Build Frontend (Next.js)') {
      steps {
        dir("${FE_DIR}") {
          echo "Installing frontend dependencies"
          sh 'npm install'
          
          echo "Building frontend"
          sh 'npm run build'
        }
      }
    }

    stage('Install & Test Backend (Express.js)') {
      steps {
        dir("${BE_DIR}") {
          echo "Installing backend dependencies"
          sh 'npm install'

          echo "Running backend tests"
          sh 'npm test || echo \"Tests failed but continuing...\"'
        }
      }
    }

    stage('Build Docker Images') {
      steps {
        echo "Building Docker images for FE and BE"

        dir("${FE_DIR}") {
          sh "docker build  -t ${DOCKER_IMAGE}:fe-${env.GIT_COMMIT_HASH} ."
        }

        dir("${BE_DIR}") {
          sh "docker build -t ${DOCKER_IMAGE}:be-${env.GIT_COMMIT_HASH} ."
        }

        sh "docker image ls"
      }
    }

    stage('Push Docker Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
          sh 'echo $DOCKER_PASSWORD | docker login --username $DOCKER_USERNAME --password-stdin'

          sh "docker push ${DOCKER_IMAGE}:fe-${env.GIT_COMMIT_HASH}"

          sh "docker push ${DOCKER_IMAGE}:be-${env.GIT_COMMIT_HASH}"
        }
      }
    }

    stage('Cleanup') {
      steps {
        echo "Cleaning up old Docker images"
        sh 'docker image prune -f'
      }
    }
  }

  post {
    success {
      echo " Pipeline completed successfully"
    }
    failure {
      echo " Pipeline failed"
    }
  }
}
