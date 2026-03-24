import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "src/generated/prisma/client"
import { Pool } from 'pg'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor(configService: ConfigService) {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        if (!databaseUrl) {
            throw new Error('DATABASE_URL is not defined in environment variables');
        }

        const pool = new Pool({ connectionString: databaseUrl });
        const adapter = new PrismaPg(pool);
        
        super({ adapter });
        
        this.logger.log('PrismaService initialized with PostgreSQL adapter');
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Successfully connected to the database');
        } catch (error) {
            this.logger.error('Failed to connect to the database', error.stack);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}