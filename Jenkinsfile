
// Định nghĩa các phương thức
void checkoutCode() {
  echo 'Checking out source code'
  checkout scm
  env.GIT_COMMIT_HASH = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
  echo "Commit Hash: ${env.GIT_COMMIT_HASH}"
}

void installAndBuildFrontend(String feDir) {
  dir(feDir) {
        echo 'Installing frontend dependencies'
        sh 'npm ci --cache .npm --prefer-offline'
        echo 'Building frontend'
        sh 'npm run build'
  }
}

void installBackend(String beDir) {
  dir(beDir) {
        echo 'Installing backend dependencies'
        sh 'npm ci --cache .npm --prefer-offline'
  }
}

void runBackendTests(String beDir) {
  dir(beDir) {
        echo 'Running backend tests'
        catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
      sh 'npm test'
        }
  }
}

String createDockerImages(String dockerImage, String feDir, String beDir, String commitHash) {
  parallel(
        'Build Frontend Image': {
            dir(feDir) {
                sh "docker build -t ${dockerImage}:fe-${commitHash} --cache-from ${dockerImage}:fe-latest ."
            }
        },
        'Build Backend Image': {
            dir(beDir) {
                sh "docker build -t ${dockerImage}:be-${commitHash} --cache-from ${dockerImage}:be-latest ."
            }
        }
    )
  sh 'docker image ls'
  return "${dockerImage}:${commitHash}"
}

void pushDockerImages(String dockerImage, String commitHash) {
  withDockerRegistry(credentialsId: 'docker-hub', url: 'https://index.docker.io/v1/') {
        sh "docker push ${dockerImage}:fe-${commitHash}"
        sh "docker push ${dockerImage}:be-${commitHash}"
  }
}

void cleanupDockerImages(String dockerImage) {
  echo 'Cleaning up old Docker images'
  String cleanupCommand = """
        docker images ${dockerImage} -q | sort -u | xargs -I {} docker rmi {} || true
        docker image prune -f
    """
  sh cleanupCommand
}

// Pipeline chính
pipeline {
  agent any

    environment {
        DOCKER_IMAGE = 'xundon/xuandong-rental-home'
        FE_DIR = 'client'
        BE_DIR = 'server'
        GIT_COMMIT_HASH = ''
        SLACK_CHANNEL = '#ci-cd'
    }

    stages {
        stage('Checkout') {
      steps {
        checkoutCode()
      }
        }

    stage('Install & Build') {
      steps {
        script {
          docker.image('node:20-alpine').inside('-v $HOME/.npm:/root/.npm -v /var/run/docker.sock:/var/run/docker.sock --user root') {
            installAndBuildFrontend(env.FE_DIR)
            installBackend(env.BE_DIR)
          }
        }
      }
    }

        stage('Run Backend Tests') {
      steps {
        runBackendTests(env.BE_DIR)
      }
        }

        stage('Build Docker Images') {
      steps {
        createDockerImages(env.DOCKER_IMAGE, env.FE_DIR, env.BE_DIR, env.GIT_COMMIT_HASH)
      }
        }

        stage('Push Docker Images') {
      steps {
        pushDockerImages(env.DOCKER_IMAGE, env.GIT_COMMIT_HASH)
      }
        }

        stage('Cleanup') {
      steps {
        cleanupDockerImages(env.DOCKER_IMAGE)
      }
        }
    }

    post {
        success {
      echo 'Pipeline completed successfully'
        }
        failure {
      echo 'Pipeline failed'
        }
    }
}
