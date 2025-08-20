# Chunk 1 Phase Breakdown: Markdown Processing Library

## Phasing Strategy Overview

The `@slashmd/md-mapper` library is broken into 4 focused phases to ensure each sub-agent can complete their work within context limits while maintaining logical dependencies. Each phase builds upon the previous one with clear handoff points.

**Key Principles:**
- Foundation-first approach (basic infrastructure before advanced features)
- Clear API contracts maintained throughout
- Incremental complexity (simple block types → complex → custom syntax → optimization)
- Self-contained deliverables per phase

---

## Phase 1: Foundation & Core Infrastructure
**Duration Estimate:** 1 session
**Dependencies:** None

### Scope
Establish the basic architecture and implement the simplest block types to validate the overall approach.

### Deliverables
1. **Package Structure Setup**
   - Complete `packages/md-mapper/` directory structure
   - `package.json` with required dependencies (unified, remark-parse, remark-gfm, etc.)
   - `tsconfig.json` configuration
   - Basic build setup

2. **Core Type System**
   - `src/index.ts` with complete TypeScript interfaces
   - `Block`, `SourceRange`, `BlockType` definitions
   - Export signatures for main functions (parseMarkdown, serializeBlocks, updateBlocks)

3. **Basic Remark Pipeline**
   - `src/parser.ts` foundation with remark processor setup
   - `src/serializer.ts` foundation with stringify capabilities
   - Source range tracking utilities in `src/ranges.ts`

4. **Simple Block Types Implementation**
   - Paragraph blocks (plain text)
   - Heading blocks (h1-h3 with level + content)
   - Divider blocks (horizontal rules)
   - Basic content extraction and serialization

5. **Initial Testing Framework**
   - Basic test setup with vitest/jest
   - Round-trip tests for implemented block types
   - Source range accuracy validation

### Success Criteria
- [ ] Package builds without errors
- [ ] Basic parseMarkdown() function works for paragraphs, headings, dividers
- [ ] serializeBlocks() produces valid markdown for implemented types
- [ ] Round-trip test: `parseMarkdown(serializeBlocks(parseMarkdown(simple_markdown))) === simple_markdown`
- [ ] Source ranges accurate for basic block types

### Handoff to Phase 2
**What Phase 2 Needs:**
- Working parser/serializer infrastructure
- Established source range tracking patterns
- Test framework and basic round-trip validation
- Clear examples of how new block types should be added

**Interface Contracts:**
- Block interface and type system must remain stable
- parseMarkdown/serializeBlocks signatures fixed
- Source range tracking utilities documented

---

## Phase 2: Standard Block Types Implementation  
**Duration Estimate:** 1-2 sessions
**Dependencies:** Phase 1 complete

### Scope
Implement all standard Markdown block types with proper nesting and complexity handling.

### Deliverables
1. **List System**
   - Ordered and unordered lists with proper nesting
   - List item handling with content preservation
   - Complex nested list scenarios

2. **Task Lists** 
   - GFM task syntax parsing (`- [ ]`, `- [x]`)
   - TaskList and TaskItem block types
   - Checkbox state preservation

3. **Blockquotes**
   - Quote block implementation
   - Nested content within quotes
   - Source range tracking for quoted content

4. **Code Blocks**
   - Fenced code blocks with language detection
   - Inline code preservation
   - Content escaping and formatting

5. **Tables**
   - GFM table parsing
   - Header and row extraction
   - Alignment detection and preservation

6. **Images**
   - Image block parsing (alt text, src, title)
   - Markdown link format preservation

7. **Expanded Testing**
   - `tests/blocks/` directory with dedicated test files
   - Complex nesting scenarios
   - Edge cases and malformed syntax handling

### Success Criteria
- [ ] All standard block types parse correctly
- [ ] Complex nested structures maintain hierarchy
- [ ] Table parsing handles all alignment options
- [ ] Task list state preserved through round-trips
- [ ] Comprehensive test coverage for each block type
- [ ] Performance acceptable for moderately complex documents

### Handoff to Phase 3
**What Phase 3 Needs:**
- Complete standard Markdown block type library
- Proven patterns for complex content parsing
- Robust test suite demonstrating reliability
- Source range tracking working for all standard types

**Interface Contracts:**
- All BlockType enum values implemented except custom syntax
- Block content structures documented and stable
- Testing patterns established for custom syntax validation

---

## Phase 3: Custom Syntax & Advanced Features
**Duration Estimate:** 1-2 sessions  
**Dependencies:** Phase 2 complete

### Scope
Implement SlashMD-specific custom syntax and advanced library features.

### Deliverables
1. **Callout System**
   - Support for `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` syntax
   - Support for `> 💡 Note:` emoji-based syntax
   - Callout type detection and content extraction
   - Integration with existing blockquote parsing

2. **Toggle/Details Support**
   - Parse `<details><summary>` HTML blocks
   - Toggle block type with summary + content
   - Collapsible content preservation

3. **Stable ID Generation**
   - `src/ids.ts` implementation
   - Hash-based ID generation for consistent block identification
   - ID stability across document edits
   - Collision handling for similar content

4. **Incremental Updates**
   - `updateBlocks()` function implementation
   - Text edit integration with source ranges
   - Efficient re-parsing of affected blocks only
   - Range adjustment after edits

5. **Advanced Testing**
   - `tests/callouts.test.ts` and `tests/toggles.test.ts`
   - Custom syntax round-trip validation
   - ID stability tests across edits
   - Incremental update accuracy tests

### Success Criteria
- [ ] Callout syntax parsed correctly in both formats
- [ ] Toggle blocks preserve all content and structure
- [ ] Block IDs remain stable across document modifications
- [ ] updateBlocks() correctly handles text edits
- [ ] Custom syntax integrates seamlessly with standard blocks
- [ ] All API functions fully implemented

### Handoff to Phase 4
**What Phase 4 Needs:**
- Complete feature implementation matching specification
- All core functions (parseMarkdown, serializeBlocks, updateBlocks) working
- Custom syntax fully integrated
- Foundation for comprehensive testing and optimization

**Interface Contracts:**
- Final API surface area complete and stable
- All block types implemented and tested
- Performance baseline established for optimization

---

## Phase 4: Testing, Performance & Production Readiness
**Duration Estimate:** 1 session
**Dependencies:** Phase 3 complete

### Scope
Comprehensive testing, performance optimization, and production-ready polish.

### Deliverables
1. **Comprehensive Test Suite**
   - Property-based testing for round-trip fidelity
   - Random document generation and validation
   - `tests/fixtures/` with complex real-world examples
   - Edge case coverage (empty documents, malformed syntax, etc.)

2. **Performance Optimization**
   - 10MB document parsing benchmark (<1 second target)
   - Memory usage optimization
   - Parser/serializer performance tuning
   - Large document handling validation

3. **Error Handling & Robustness**
   - Malformed syntax graceful handling
   - Invalid source range recovery
   - Input validation for all public functions

4. **Documentation & Examples**
   - Complete README.md with usage examples
   - API documentation in code
   - Integration examples
   - Migration notes if needed

5. **Production Polish**
   - Final round-trip fidelity validation (100+ random documents)
   - Test coverage analysis (>90% target)
   - Package metadata and publishing preparation
   - Final API review and stability confirmation

### Success Criteria
- [ ] >90% test coverage achieved
- [ ] 100+ random documents pass round-trip tests
- [ ] 10MB document parses in <1 second
- [ ] Zero dependencies on VS Code/UI frameworks
- [ ] Comprehensive documentation complete
- [ ] Ready for integration by other chunks

### Handoff to Integration
**What Integration Chunk Needs:**
- Stable, tested `@slashmd/md-mapper` package
- Clear API documentation and usage examples
- Performance characteristics documented
- Known limitations and edge cases documented

**Final Deliverables:**
- Production-ready NPM package
- Complete test suite demonstrating reliability
- Performance benchmarks and optimization notes
- Integration-ready API with stable contracts

---

## Cross-Phase Guidelines

### Context Minimization
- Each phase should document its changes in a brief handoff summary
- Avoid deep code diving in handoffs - focus on interface contracts
- Test files serve as documentation of expected behavior
- README updates track feature completion status

### Quality Gates
- Each phase must pass existing tests before adding new features
- No phase should break previously working functionality
- Source range accuracy must be maintained throughout
- Round-trip fidelity is non-negotiable

### Risk Mitigation
- Phase 1 validates the overall technical approach early
- Phase 2 proves scalability with complex standard features
- Phase 3 addresses custom requirements before optimization
- Phase 4 ensures production readiness and integration success