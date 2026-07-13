-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "primaryGoal" TEXT NOT NULL,
    "targetTimeframeWeeks" INTEGER NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" TEXT NOT NULL,
    "heightCm" REAL NOT NULL,
    "weightKg" REAL NOT NULL,
    "bodyFatPct" REAL,
    "activityLevel" TEXT NOT NULL,
    "trainingLocation" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "sessionLengthMin" INTEGER NOT NULL,
    "dietaryRestrictions" TEXT NOT NULL,
    "allergies" TEXT NOT NULL,
    "mealsPerDay" INTEGER NOT NULL,
    "cookingTimeBudgetMin" INTEGER NOT NULL,
    "currentInjuries" TEXT NOT NULL,
    "pastInjuries" TEXT NOT NULL,
    "medicalConditions" TEXT NOT NULL,
    "doctorClearance" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Profile_id_fkey" FOREIGN KEY ("id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "workoutPlan" TEXT NOT NULL,
    "mealPlan" TEXT NOT NULL,
    "classification" TEXT,
    "claudeReasoning" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeeklyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyCheckin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "sessionCompleted" BOOLEAN NOT NULL,
    "exercisesLogged" TEXT NOT NULL,
    "mealsLogged" INTEGER NOT NULL,
    "mealsPlanned" INTEGER NOT NULL,
    "estKcal" REAL NOT NULL,
    "targetKcal" REAL NOT NULL,
    "sleepHours" REAL NOT NULL,
    "soreness1to10" INTEGER NOT NULL,
    "stress1to10" INTEGER NOT NULL,
    "painFlag" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyCheckin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
