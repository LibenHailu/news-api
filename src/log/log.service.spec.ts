import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ReadLogService } from './log.service';

describe('ReadLogService', () => {
  let service: ReadLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadLogService,
        {
          provide: getModelToken('ReadLog'),
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReadLogService>(ReadLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
