# Используйте официальный образ OpenJDK
FROM openjdk:21

# Укажите переменную для jar файла
ARG JAR_FILE=*.jar

# Установите рабочую директорию
WORKDIR /app

# Копируйте jar файл в контейнер
COPY ${JAR_FILE} application.jar

# Откройте порт, который будет использоваться приложением
EXPOSE 8080

# Запустите приложение
ENTRYPOINT ["java", "-jar", "application.jar"]