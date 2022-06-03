
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID

class PromoteRowToHeaderCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Promote Row To Header'
    
    def get_description_comment(self) -> str:
        sheet_index: int = self.get_param('sheet_index')
        row_index: int = self.get_param('row_index')

        df_name = self.post_state.df_names[sheet_index]

        return f"Promoted {row_index} to header in {df_name}"
        
    def get_code(self) -> List[str]:
        sheet_index: int = self.get_param('sheet_index')
        row_index: int = self.get_param('row_index')

        df_name = self.post_state.df_names[sheet_index]
        
        return [
            f"{df_name}.columns = {df_name}.iloc[{row_index}]",
            f"{df_name}.drop({row_index}, axis=0, inplace=True)",
        ]
    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]
    